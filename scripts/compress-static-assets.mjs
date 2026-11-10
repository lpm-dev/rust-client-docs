/**
 * Writes a maximum-quality brotli copy of each script, stylesheet and SVG in
 * the build's static assets (`.next/static`), which the server sends to
 * clients that accept brotli (lib/precompressed-assets.mjs).
 *
 * npm runs it after `npm run build` (postbuild).
 */
import { existsSync } from "node:fs";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { brotliCompress, constants } from "node:zlib";
import {
  BROTLI_SUFFIX,
  PRECOMPRESSED_TYPES,
} from "../lib/precompressed-assets.mjs";

const compress = promisify(brotliCompress);

/**
 * Writes `<file>.br` beside each script, stylesheet and SVG under
 * `staticDirectory`. A file brotli doesn't make smaller gets no copy, and
 * loses one an earlier run wrote. zlib compresses on libuv's thread pool, so
 * the files compress in parallel.
 *
 * @param {string} staticDirectory
 * @returns {Promise<{ files: number, copies: number, originalBytes: number, brotliBytes: number }>}
 *   `originalBytes` and `brotliBytes` count the files that got a copy.
 */
export async function compressStaticAssets(staticDirectory) {
  const entries = await readdir(staticDirectory, {
    recursive: true,
    withFileTypes: true,
  });
  const files = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        Object.hasOwn(PRECOMPRESSED_TYPES, extname(entry.name)),
    )
    .map((entry) => join(entry.parentPath, entry.name));

  const result = {
    files: files.length,
    copies: 0,
    originalBytes: 0,
    brotliBytes: 0,
  };
  await Promise.all(
    files.map(async (file) => {
      const source = await readFile(file);
      const copy = await compress(source, {
        params: {
          [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
          [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
          [constants.BROTLI_PARAM_SIZE_HINT]: source.length,
        },
      });
      if (copy.length >= source.length) {
        await rm(`${file}${BROTLI_SUFFIX}`, { force: true });
        return;
      }
      await writeFile(`${file}${BROTLI_SUFFIX}`, copy);
      result.copies++;
      result.originalBytes += source.length;
      result.brotliBytes += copy.length;
    }),
  );
  return result;
}

async function main() {
  const staticDirectory = fileURLToPath(
    new URL("../.next/static", import.meta.url),
  );
  if (!existsSync(staticDirectory)) {
    throw new Error("No .next/static. Run next build first.");
  }
  const startedAt = performance.now();
  const { files, copies, originalBytes, brotliBytes } =
    await compressStaticAssets(staticDirectory);
  const kilobytes = (bytes) => `${Math.round(bytes / 1024)} KB`;
  console.log(
    `Compressed ${copies} of ${files} static assets with brotli, ${kilobytes(originalBytes)} to ${kilobytes(brotliBytes)}, in ${((performance.now() - startedAt) / 1000).toFixed(1)}s`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
