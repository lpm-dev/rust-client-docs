import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import next from "next";
import { negotiatesOnAccept } from "./lib/content-negotiation.mjs";
import { normalizeOriginVary } from "./lib/vary.mjs";

const DEFAULT_PORT = 3000;

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

async function start() {
  const port = portFrom(process.argv.slice(2));
  const hostname = process.env.LPM_DOCS_HOST || "0.0.0.0";
  const app = next({ dev: false, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();
  createServer((request, response) => {
    installFinalVariance(request, response);
    handle(request, response);
  }).listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await start();
}
