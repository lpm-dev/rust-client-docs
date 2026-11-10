import { randomBytes } from "node:crypto";
import { once } from "node:events";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {
  createServer,
  request as httpRequest,
  type IncomingHttpHeaders,
  type Server,
} from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { brotliCompressSync, brotliDecompressSync, gzipSync } from "node:zlib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  acceptsBrotli,
  createPrecompressedAssetHandler,
  loadPrecompressedAssets,
} from "@/lib/precompressed-assets.mjs";
import { compressStaticAssets } from "@/scripts/compress-static-assets.mjs";
import { createRequestHandler } from "@/server.mjs";

const SCRIPT = Buffer.from(
  Array.from(
    { length: 400 },
    (_, i) => `export const value${i} = "item ${i}";`,
  ).join("\n"),
);
const CHROME = "gzip, deflate, br, zstd";

function writeFile(directory: string, path: string, content: string | Buffer) {
  const file = join(directory, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content);
}

function writeAsset(
  directory: string,
  path: string,
  content: Buffer,
  copy = true,
) {
  writeFile(directory, path, content);
  if (copy) {
    writeFileSync(join(directory, `${path}.br`), brotliCompressSync(content));
  }
}

type Response = { status: number; headers: IncomingHttpHeaders; body: Buffer };

/** Requests `path` as written, on a new connection, and keeps the body encoded. */
function get(
  port: number,
  path: string,
  headers: Record<string, string> = {},
  method = "GET",
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const outgoing = httpRequest(
      { host: "127.0.0.1", port, path, method, headers, agent: false },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () =>
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks),
          }),
        );
      },
    );
    outgoing.on("error", reject);
    outgoing.end();
  });
}

describe("acceptsBrotli", () => {
  it.each<[string | undefined, boolean]>([
    [CHROME, true],
    ["br", true],
    ["BR", true],
    ["gzip;q=1.0, br;q=0.5", true],
    ["*", true],
    ["gzip, *;q=0.1", true],
    ["br;level=5", true],
    ["gzip, deflate", false],
    ["identity", false],
    ["", false],
    [undefined, false],
    ["br;q=0", false],
    ["gzip, br; q=0.000", false],
    ["*, br;q=0", false],
    ["br;q=0, *", false],
    ["*;q=0", false],
    ["br;q=", false],
    ["br;q=2", false],
    ["brotli", false],
  ])("%j → %s", (header, accepted) => {
    expect(acceptsBrotli(header)).toBe(accepted);
  });
});

describe("loadPrecompressedAssets", () => {
  let directory: string;

  beforeAll(() => {
    directory = mkdtempSync(join(tmpdir(), "docs-precompressed-"));
    writeAsset(directory, "chunks/app.js", SCRIPT);
    writeAsset(directory, "chunks/app/(home)/page.js", SCRIPT);
    writeAsset(
      directory,
      "css/styles.css",
      Buffer.from(".card { color: red }\n".repeat(64)),
    );
    writeAsset(directory, "media/icon.svg", Buffer.from("<svg/>".repeat(40)));
    writeAsset(directory, "media/font.woff2", Buffer.from("font"));
    writeAsset(directory, "chunks/plain.js", SCRIPT, false);
    writeFileSync(
      join(directory, "chunks/gone.js.br"),
      brotliCompressSync(SCRIPT),
    );
  });

  afterAll(() => rmSync(directory, { recursive: true, force: true }));

  it("indexes each copy by its original's path, with the type Next sends", async () => {
    const assets = await loadPrecompressedAssets(directory);

    expect([...assets.keys()].sort()).toEqual([
      "chunks/app.js",
      "chunks/app/(home)/page.js",
      "css/styles.css",
      "media/icon.svg",
    ]);
    expect(assets.get("chunks/app.js")?.contentType).toBe(
      "application/javascript; charset=UTF-8",
    );
    expect(assets.get("css/styles.css")?.contentType).toBe(
      "text/css; charset=UTF-8",
    );
    expect(assets.get("media/icon.svg")?.contentType).toBe("image/svg+xml");
    const app = assets.get("chunks/app.js");
    expect(app && brotliDecompressSync(app.body)).toEqual(SCRIPT);
  });

  it("gives each copy a strong ETag of its bytes", async () => {
    const assets = await loadPrecompressedAssets(directory);
    const etag = assets.get("chunks/app.js")?.etag;

    expect(etag).toMatch(/^"br-[\w-]{27}"$/);
    expect(assets.get("chunks/app/(home)/page.js")?.etag).toBe(etag);
    expect(assets.get("css/styles.css")?.etag).not.toBe(etag);
  });

  it("finds no copies when the directory doesn't exist", async () => {
    expect(
      (await loadPrecompressedAssets(join(directory, "missing"))).size,
    ).toBe(0);
  });
});

describe("the server with precompressed assets", () => {
  let directory: string;
  let server: Server;
  let port: number;

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), "docs-precompressed-"));
    writeAsset(directory, "chunks/app.js", SCRIPT);
    writeAsset(directory, "chunks/app/(home)/page.js", SCRIPT);
    writeAsset(directory, "chunks/plain.js", SCRIPT, false);
    server = createServer(
      createRequestHandler({
        handle: (_request, response) => {
          response.setHeader("X-Served-By", "next");
          response.setHeader("Vary", "Accept-Encoding");
          response.end("next");
        },
        isClosing: () => false,
        version: "0123abc",
        serveAsset: createPrecompressedAssetHandler(
          await loadPrecompressedAssets(directory),
        ),
      }),
    );
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    port = (server.address() as AddressInfo).port;
  });

  afterAll(() => {
    server.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it("sends the brotli copy to a client that accepts brotli", async () => {
    const response = await get(port, "/_next/static/chunks/app.js", {
      "Accept-Encoding": CHROME,
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-encoding"]).toBe("br");
    expect(response.headers["content-type"]).toBe(
      "application/javascript; charset=UTF-8",
    );
    expect(response.headers["cache-control"]).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(Number(response.headers["content-length"])).toBe(
      response.body.length,
    );
    expect(String(response.headers.etag)).toMatch(/^"br-/);
    expect(response.headers["x-app-version"]).toBe("0123abc");
    expect(brotliDecompressSync(response.body)).toEqual(SCRIPT);
  });

  it("leaves Accept-Encoding out of Vary, as every origin response does", async () => {
    const response = await get(port, "/_next/static/chunks/app.js", {
      "Accept-Encoding": "br",
    });

    expect(response.headers["content-encoding"]).toBe("br");
    expect(response.headers.vary).toBeUndefined();
  });

  it.each([
    "/_next/static/chunks/app.js?dpl=abc",
    "/_next/static/chunks/app/%28home%29/page.js",
  ])("ignores the query string and matches a percent-encoded path: %s", async (path) => {
    const response = await get(port, path, { "Accept-Encoding": "br" });

    expect(response.headers["content-encoding"]).toBe("br");
  });

  it("answers HEAD with the copy's headers and no body", async () => {
    const response = await get(
      port,
      "/_next/static/chunks/app.js",
      { "Accept-Encoding": "br" },
      "HEAD",
    );

    expect(response.status).toBe(200);
    expect(response.headers["content-encoding"]).toBe("br");
    expect(Number(response.headers["content-length"])).toBeGreaterThan(0);
    expect(response.body.length).toBe(0);
  });

  it("answers a request that names the copy's ETag with 304", async () => {
    const { headers } = await get(port, "/_next/static/chunks/app.js", {
      "Accept-Encoding": "br",
    });

    const response = await get(port, "/_next/static/chunks/app.js", {
      "Accept-Encoding": "br",
      "If-None-Match": `"other", W/${headers.etag}`,
    });

    expect(response.status).toBe(304);
    expect(response.headers.etag).toBe(headers.etag);
    expect(response.headers["content-encoding"]).toBeUndefined();
    expect(response.body.length).toBe(0);
  });

  it("sends a copy whole when the client's ETag is another representation's", async () => {
    const response = await get(port, "/_next/static/chunks/app.js", {
      "Accept-Encoding": "br",
      "If-None-Match": 'W/"800-19a2b3c4d5e"',
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-encoding"]).toBe("br");
  });

  it.each<[string, string, Record<string, string>, string?]>([
    [
      "a client that doesn't accept brotli",
      "/_next/static/chunks/app.js",
      { "Accept-Encoding": "gzip, deflate" },
    ],
    [
      "a client that refuses brotli",
      "/_next/static/chunks/app.js",
      { "Accept-Encoding": "gzip, br;q=0" },
    ],
    ["a client with no Accept-Encoding", "/_next/static/chunks/app.js", {}],
    [
      "a range request",
      "/_next/static/chunks/app.js",
      { "Accept-Encoding": "br", Range: "bytes=0-9" },
    ],
    [
      "a file without a copy",
      "/_next/static/chunks/plain.js",
      { "Accept-Encoding": "br" },
    ],
    [
      "a file that doesn't exist",
      "/_next/static/chunks/missing.js",
      { "Accept-Encoding": "br" },
    ],
    [
      "a path outside the static files",
      "/chunks/app.js",
      { "Accept-Encoding": "br" },
    ],
    [
      "a path that leaves the static files",
      "/_next/static/chunks/../chunks/app.js",
      { "Accept-Encoding": "br" },
    ],
    [
      "a malformed percent-encoding",
      "/_next/static/chunks/%E0%A4%A.js",
      { "Accept-Encoding": "br" },
    ],
    [
      "a POST",
      "/_next/static/chunks/app.js",
      { "Accept-Encoding": "br" },
      "POST",
    ],
  ])("passes %s on to Next", async (_label, path, headers, method) => {
    const response = await get(port, path, headers, method);

    expect(response.headers["x-served-by"]).toBe("next");
    expect(response.headers["content-encoding"]).toBeUndefined();
    expect(response.headers.vary).toBeUndefined();
  });
});

describe("compressStaticAssets", () => {
  let directory: string;

  beforeAll(() => {
    directory = mkdtempSync(join(tmpdir(), "docs-static-"));
    writeFile(directory, "chunks/app.js", SCRIPT);
    writeFile(
      directory,
      "css/styles.css",
      ".card { color: red; padding: 4px }\n".repeat(80),
    );
    writeFile(
      directory,
      "media/logo.svg",
      '<svg><path d="M0 0h10v10z"/></svg>\n'.repeat(40),
    );
    writeFile(directory, "media/font.woff2", randomBytes(4096));
    writeFile(directory, "chunks/tiny.js", "1");
    writeFile(directory, "chunks/tiny.js.br", "stale");
  });

  afterAll(() => rmSync(directory, { recursive: true, force: true }));

  it("writes a copy of each script, stylesheet and SVG that the server loads", async () => {
    const result = await compressStaticAssets(directory);

    for (const path of ["chunks/app.js", "css/styles.css", "media/logo.svg"]) {
      expect(
        brotliDecompressSync(readFileSync(join(directory, `${path}.br`))),
      ).toEqual(readFileSync(join(directory, path)));
    }
    expect(existsSync(join(directory, "media/font.woff2.br"))).toBe(false);
    expect({ files: result.files, copies: result.copies }).toEqual({
      files: 4,
      copies: 3,
    });
    expect(
      [...(await loadPrecompressedAssets(directory)).keys()].sort(),
    ).toEqual(["chunks/app.js", "css/styles.css", "media/logo.svg"]);
  });

  it("compresses scripts smaller than gzip at its highest level", async () => {
    await compressStaticAssets(directory);

    const copy = readFileSync(join(directory, "chunks/app.js.br"));
    expect(copy.length).toBeLessThan(gzipSync(SCRIPT, { level: 9 }).length);
  });

  it("writes no copy brotli doesn't make smaller, and removes an earlier one", async () => {
    await compressStaticAssets(directory);

    expect(existsSync(join(directory, "chunks/tiny.js.br"))).toBe(false);
  });

  it("doesn't compress its own copies when it runs again", async () => {
    await compressStaticAssets(directory);
    const result = await compressStaticAssets(directory);

    expect({ files: result.files, copies: result.copies }).toEqual({
      files: 4,
      copies: 3,
    });
    expect(
      readdirSync(directory, { recursive: true }).filter((name) =>
        String(name).endsWith(".br.br"),
      ),
    ).toEqual([]);
  });
});
