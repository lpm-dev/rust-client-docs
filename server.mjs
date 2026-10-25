import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import next from "next";
import { negotiatesOnAccept } from "./lib/content-negotiation.mjs";
import { normalizeOriginVary } from "./lib/vary.mjs";
import { DRAIN_SIGNAL, isDraining, startDraining } from "./server-drain.mjs";

const DEFAULT_PORT = 3000;
const FORCE_CLOSE_MS = 15_000;

export { negotiatesOnAccept };

/** @param {string[]} args */
function portFrom(args) {
  const flagIndex = args.findIndex(
    (value) => value === "-p" || value === "--port",
  );
  const value =
    flagIndex >= 0 ? args[flagIndex + 1] : process.env.PORT || DEFAULT_PORT;
  const port = Number.parseInt(String(value), 10);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid server port: ${value}`);
  }
  return port;
}

/**
 * @param {import("node:http").OutgoingHttpHeaders | import("node:http").OutgoingHttpHeader[]} headers
 * @param {string | number | readonly string[] | undefined} existing
 * @param {boolean} accept
 */
function normalizeWriteHeadVary(headers, existing, accept) {
  if (Array.isArray(headers)) {
    const merged = [];
    const varyValues = [existing];
    let varyIndex = -1;

    for (let index = 0; index < headers.length; index += 2) {
      if (String(headers[index]).toLowerCase() === "vary") {
        if (varyIndex < 0) varyIndex = merged.length;
        varyValues.push(headers[index + 1]);
      } else {
        merged.push(headers[index], headers[index + 1]);
      }
    }

    const vary = normalizeOriginVary(varyValues, { accept });
    if (vary) {
      merged.splice(varyIndex < 0 ? merged.length : varyIndex, 0, "Vary", vary);
    }
    return merged;
  }

  const merged = { ...headers };
  const keys = Object.keys(merged).filter(
    (name) => name.toLowerCase() === "vary",
  );
  const vary = normalizeOriginVary(
    [existing, ...keys.map((key) => merged[key])],
    { accept },
  );
  for (const key of keys) delete merged[key];
  if (vary) merged.Vary = vary;
  return merged;
}

/**
 * Next's renderer can replace earlier Vary values. Normalize the header at the
 * final Node response boundary. Cloudflare owns compression, so the origin
 * must not emit Accept-Encoding variance.
 *
 * @param {import("node:http").IncomingMessage} request
 * @param {import("node:http").ServerResponse} response
 */
export function installFinalVariance(request, response) {
  const accept = negotiatesOnAccept(request.url);
  const setHeader = response.setHeader;

  response.setHeader = function setNormalizedHeader(name, value) {
    if (String(name).toLowerCase() !== "vary") {
      return setHeader.call(this, name, value);
    }

    const vary = normalizeOriginVary(value, { accept });
    if (!vary) {
      this.removeHeader(name);
      return this;
    }
    return setHeader.call(this, name, vary);
  };

  const writeHead = response.writeHead;
  response.writeHead = function writeNormalizedHead(
    statusCode,
    statusMessageOrHeaders,
    headers,
  ) {
    const currentVary = normalizeOriginVary(this.getHeader("Vary"), {
      accept,
    });
    if (currentVary) setHeader.call(this, "Vary", currentVary);
    else this.removeHeader("Vary");

    if (typeof statusMessageOrHeaders === "string") {
      return writeHead.call(
        this,
        statusCode,
        statusMessageOrHeaders,
        headers
          ? normalizeWriteHeadVary(headers, currentVary, accept)
          : undefined,
      );
    }

    return writeHead.call(
      this,
      statusCode,
      statusMessageOrHeaders
        ? normalizeWriteHeadVary(statusMessageOrHeaders, currentVary, accept)
        : undefined,
    );
  };

  if (accept) response.setHeader("Vary", "Accept");
}

/** @param {string | undefined} value */
export function drainMsFrom(value) {
  if (value === undefined || value === "") return 0;
  const drainMs = Number(value);
  if (!Number.isSafeInteger(drainMs) || drainMs < 0) {
    throw new Error(`Invalid DOCS_SHUTDOWN_DRAIN_MS: ${value}`);
  }
  return drainMs;
}

/**
 * Stops the server without cutting requests. The drain signal makes
 * /api/ready fail; after `drainMs`, once Docker has marked the container
 * unhealthy and Traefik has stopped routing to it, the server stops accepting
 * connections and exits when its requests finish. SIGTERM and SIGINT skip the
 * drain. Requests still open `forceMs` after the close are cut.
 *
 * @param {{
 *   server: import("node:http").Server,
 *   closeApp?: () => unknown,
 *   drainMs: number,
 *   forceMs?: number,
 *   signals?: Pick<NodeJS.EventEmitter, "on">,
 *   exit?: (code: number) => void,
 *   log?: (message: string) => void,
 * }} options
 */
export function installGracefulShutdown({
  server,
  closeApp,
  drainMs,
  forceMs = FORCE_CLOSE_MS,
  signals = process,
  exit = (code) => process.exit(code),
  log = console.log,
}) {
  let closing = false;

  function close(reason) {
    if (closing) return;
    closing = true;
    log(`> Closing (${reason})`);
    const force = setTimeout(() => {
      log("> Closing: requests still open, cutting them");
      server.closeAllConnections();
      exit(1);
    }, forceMs);
    force.unref();
    server.close(() => {
      Promise.resolve()
        .then(() => closeApp?.())
        .catch((error) => console.error(error))
        .finally(() => {
          clearTimeout(force);
          exit(0);
        });
    });
  }

  signals.on(DRAIN_SIGNAL, () => {
    if (closing || isDraining()) return;
    startDraining();
    log(`> Draining for ${drainMs} ms`);
    setTimeout(() => close("drained"), drainMs);
  });
  for (const signal of ["SIGTERM", "SIGINT"]) {
    signals.on(signal, () => close(signal));
  }

  return {
    /** Keep-alive sockets would otherwise hold the closing server open. */
    isClosing: () => closing,
  };
}

async function start() {
  const port = portFrom(process.argv.slice(2));
  const hostname = process.env.LPM_DOCS_HOST || "0.0.0.0";
  const drainMs = drainMsFrom(process.env.DOCS_SHUTDOWN_DRAIN_MS);
  // The commit the image was built from; deploys wait until it's served.
  const version = process.env.APP_VERSION;
  const app = next({ dev: false, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();
  const server = createServer((request, response) => {
    if (shutdown.isClosing()) response.shouldKeepAlive = false;
    if (version) response.setHeader("X-App-Version", version);
    installFinalVariance(request, response);
    handle(request, response);
  });
  const shutdown = installGracefulShutdown({
    server,
    closeApp: () => app.close(),
    drainMs,
  });
  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await start();
}
