/**
 * Sends the brotli copies of Next's static assets that the build writes
 * (`scripts/compress-static-assets.mjs`). Cloudflare compresses the
 * uncompressed files it gets on the fly, at a quality close to gzip's. A copy
 * at maximum quality is about 16% smaller, too slow to make per response, so
 * the build makes it once. Cloudflare asks the origin for `br, gzip`, caches
 * the copy, and converts it for a visitor without brotli.
 *
 * Anything these copies can't answer goes to Next as before: a client that
 * doesn't accept brotli, a range request, and a file without a copy. As for
 * every response (see installFinalVariance in server.mjs), the origin leaves
 * Accept-Encoding out of Vary: Cloudflare owns compression.
 */
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";

export const BROTLI_SUFFIX = ".br";

/** The types the build compresses, with the Content-Type Next sends for each. */
export const PRECOMPRESSED_TYPES = Object.freeze({
  ".css": "text/css; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".svg": "image/svg+xml",
});

const STATIC_PREFIX = "/_next/static/";

/** What Next sends for its hashed static files. */
const CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * @typedef {{ body: Buffer, contentType: string, etag: string }} PrecompressedAsset
 */

/**
 * The brotli copies under `staticDirectory`, by their original's path
 * relative to it with `/` separators. A copy whose original is gone is left
 * out, so a stale copy can't answer for a file Next no longer serves.
 *
 * @param {string} staticDirectory
 * @returns {Promise<Map<string, PrecompressedAsset>>}
 */
export async function loadPrecompressedAssets(staticDirectory) {
  const assets = new Map();
  let entries;
  try {
    entries = await readdir(staticDirectory, {
      recursive: true,
      withFileTypes: true,
    });
  } catch (error) {
    if (error?.code === "ENOENT") return assets;
    throw error;
  }
  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isFile() || !entry.name.endsWith(BROTLI_SUFFIX)) return;
      const copyPath = join(entry.parentPath, entry.name);
      const originalPath = copyPath.slice(0, -BROTLI_SUFFIX.length);
      const contentType = PRECOMPRESSED_TYPES[extname(originalPath)];
      if (!contentType) return;
      const [body, original] = await Promise.all([
        readFile(copyPath),
        stat(originalPath).catch(() => null),
      ]);
      if (!original?.isFile()) return;
      const digest = createHash("sha256").update(body).digest("base64url");
      assets.set(relative(staticDirectory, originalPath).split(sep).join("/"), {
        body,
        contentType,
        etag: `"br-${digest.slice(0, 27)}"`,
      });
    }),
  );
  return assets;
}

/**
 * Whether an Accept-Encoding header accepts brotli: `br`, or `*` when `br`
 * isn't listed, with a quality above zero.
 *
 * @param {string | undefined} header
 */
export function acceptsBrotli(header) {
  if (!header) return false;
  let brotli;
  let wildcard = 0;
  for (const element of header.split(",")) {
    const [coding, ...parameters] = element.split(";");
    const name = coding.trim().toLowerCase();
    if (name !== "br" && name !== "*") continue;
    let quality = 1;
    for (const parameter of parameters) {
      const separator = parameter.indexOf("=");
      if (
        separator === -1 ||
        parameter.slice(0, separator).trim().toLowerCase() !== "q"
      ) {
        continue;
      }
      const value = parameter.slice(separator + 1).trim();
      quality = value === "" ? Number.NaN : Number(value);
    }
    if (!(quality >= 0 && quality <= 1)) quality = 0;
    if (name === "br") brotli = quality;
    else wildcard = quality;
  }
  return (brotli ?? wildcard) > 0;
}

/**
 * Whether an If-None-Match header names `etag`, compared weakly as RFC 9110
 * requires for this header.
 *
 * @param {string | undefined} header
 * @param {string} etag
 */
function matchesEtag(header, etag) {
  if (!header) return false;
  for (const element of header.split(",")) {
    const tag = element.trim();
    if (tag === "*" || (tag.startsWith("W/") ? tag.slice(2) : tag) === etag) {
      return true;
    }
  }
  return false;
}

/**
 * A request handler that answers from `assets` and returns `true`, or returns
 * `false` without touching the response so the caller passes the request on.
 *
 * @param {Map<string, PrecompressedAsset>} assets
 * @returns {(request: import("node:http").IncomingMessage, response: import("node:http").ServerResponse) => boolean}
 */
export function createPrecompressedAssetHandler(assets) {
  return function servePrecompressedAsset(request, response) {
    if (assets.size === 0) return false;
    if (request.method !== "GET" && request.method !== "HEAD") return false;
    const url = request.url ?? "";
    if (!url.startsWith(STATIC_PREFIX) || request.headers.range) return false;
    const queryAt = url.indexOf("?");
    let path;
    try {
      path = decodeURIComponent(
        url.slice(STATIC_PREFIX.length, queryAt === -1 ? undefined : queryAt),
      );
    } catch {
      return false;
    }
    const asset = assets.get(path);
    if (!asset || !acceptsBrotli(request.headers["accept-encoding"])) {
      return false;
    }

    const headers = { "Cache-Control": CACHE_CONTROL, ETag: asset.etag };
    if (matchesEtag(request.headers["if-none-match"], asset.etag)) {
      response.writeHead(304, headers);
      response.end();
      return true;
    }
    response.writeHead(200, {
      ...headers,
      "Content-Encoding": "br",
      "Content-Length": asset.body.length,
      "Content-Type": asset.contentType,
    });
    response.end(request.method === "HEAD" ? undefined : asset.body);
    return true;
  };
}
