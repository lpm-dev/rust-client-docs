import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import next from "next";
import { negotiatesOnAccept } from "./lib/content-negotiation.mjs";
import { mergeVary } from "./lib/vary.mjs";

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

/** @param {import("node:http").OutgoingHttpHeaders | import("node:http").OutgoingHttpHeader[]} headers */
function mergeWriteHeadVary(headers) {
  if (Array.isArray(headers)) {
    const merged = [...headers];
    const index = merged.findIndex(
      (value, itemIndex) =>
        itemIndex % 2 === 0 && String(value).toLowerCase() === "vary",
    );
    if (index >= 0) {
      merged[index + 1] = mergeVary(merged[index + 1], "Accept");
    } else {
      merged.push("Vary", "Accept");
    }
    return merged;
  }

  const merged = { ...headers };
  const key = Object.keys(merged).find((name) => name.toLowerCase() === "vary");
  const varyKey = key ?? "Vary";
  merged[varyKey] = mergeVary(merged[varyKey], "Accept");
  return merged;
}

/**
 * Next's HTML renderer replaces earlier Vary values. Merge Accept at the final
 * Node response boundary so content-negotiated HTML and markdown cannot share
 * a cache entry, while preserving RSC and compression variance.
 *
 * @param {import("node:http").IncomingMessage} request
 * @param {import("node:http").ServerResponse} response
 */
export function installAcceptVariance(request, response) {
  if (!negotiatesOnAccept(request.url)) return;

  const setHeader = response.setHeader;
  response.setHeader = function setHeaderWithAccept(name, value) {
    const finalValue =
      String(name).toLowerCase() === "vary"
        ? mergeVary(value, "Accept")
        : value;
    return setHeader.call(this, name, finalValue);
  };

  const writeHead = response.writeHead;
  response.writeHead = function writeHeadWithAccept(
    statusCode,
    statusMessageOrHeaders,
    headers,
  ) {
    setHeader.call(this, "Vary", mergeVary(this.getHeader("Vary"), "Accept"));

    if (typeof statusMessageOrHeaders === "string") {
      return writeHead.call(
        this,
        statusCode,
        statusMessageOrHeaders,
        headers ? mergeWriteHeadVary(headers) : undefined,
      );
    }

    return writeHead.call(
      this,
      statusCode,
      statusMessageOrHeaders
        ? mergeWriteHeadVary(statusMessageOrHeaders)
        : undefined,
    );
  };

  response.setHeader("Vary", "Accept");
}

async function start() {
  const port = portFrom(process.argv.slice(2));
  const hostname = process.env.LPM_DOCS_HOST || "0.0.0.0";
  const app = next({ dev: false, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();
  createServer((request, response) => {
    installAcceptVariance(request, response);
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
