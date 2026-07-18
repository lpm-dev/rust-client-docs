# 008 — Self-host Open Graph fonts

- **Status**: DONE
- **Commit**: bfed31a
- **Severity**: MEDIUM
- **Category**: Maintainability & architecture
- **Rule**: Beyond the scan
- **Estimated scope**: 4 files, 2 binary assets, about 45 code/test lines

## Problem

`lib/og.tsx:12` stores two Google Fonts URLs, and `loadAssets` fetches them when an OG image is generated:

    // lib/og.tsx:12 — current
    const FONT_REGULAR_URL =
      "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Au-0.ttf";
    const FONT_BOLD_URL =
      "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Au-0.ttf";

    const [regularRes, boldRes, svg] = await Promise.all([
      fetch(FONT_REGULAR_URL),
      fetch(FONT_BOLD_URL),
      readFile(join(process.cwd(), "public/lpm-og-logo.svg"), "utf-8"),
    ]);

The code does not check response status, and a rejected asset promise is retained for the process lifetime. More importantly, production builds and cold OG generation depend on an external font host even though the logo is already read locally.

## Target

Commit the exact TTF payloads currently used by the route:

| File | Source | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `public/fonts/inter-og-regular.ttf` | `https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Au-0.ttf` | 337936 | `aff10562c603409a49b7ef6591467cb02fc5f6f412ecde10a3f3dcd8f0d6fa52` |
| `public/fonts/inter-og-bold.ttf` | `https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Au-0.ttf` | 339200 | `95125c934078475c386060a78206961655e9b20a5b79557b97b7c4b728eb9207` |

Replace the URL constants and network fetches with local reads:

    const FONT_REGULAR_PATH = join(
      process.cwd(),
      "public/fonts/inter-og-regular.ttf",
    );
    const FONT_BOLD_PATH = join(
      process.cwd(),
      "public/fonts/inter-og-bold.ttf",
    );
    const LOGO_PATH = join(process.cwd(), "public/lpm-og-logo.svg");

    function loadAssets(): Promise<AssetCache> {
      if (!cachedAssets) {
        cachedAssets = Promise.all([
          readFile(FONT_REGULAR_PATH),
          readFile(FONT_BOLD_PATH),
          readFile(LOGO_PATH, "utf-8"),
        ]).then(([fontRegular, fontBold, svg]) => ({
          fontRegular,
          fontBold,
          logoDataUri: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
        }));
      }
      return cachedAssets;
    }

Change the cache type to the exact local-read result. Satori accepts Node `Buffer` or `ArrayBuffer` font data:

    type AssetCache = {
      fontRegular: Buffer;
      fontBold: Buffer;
      logoDataUri: string;
    };

## Repo conventions to follow

- Keep the existing module-level asset promise and parallel loading structure.
- Keep `readFile(join(process.cwd(), ...))`, matching the working logo asset path.
- Preserve Inter font names, weights, ImageResponse options, dimensions, and all visual template values.
- Add a focused `tests/unit/og.test.ts` using explicit Vitest imports.

## Steps

1. Download the two exact source URLs into the explicit `public/fonts/` paths; do not use a glob or generated filename.
2. Verify each byte count and SHA-256 from the table before editing code. Stop on a mismatch.
3. Replace URL constants with local path constants and replace `fetch`/`arrayBuffer` with the exact `readFile` target.
4. Remove all `fonts.gstatic.com` and font-response references from `lib/og.tsx`.
5. Add a unit test that calls `renderOgTemplate`, asserts two fonts with weights 400/700, and asserts both data payloads have non-zero byte length.
6. Render `/og/home` and one `/og/docs/.../image.png` route during a production build and visually compare them with the current output.
7. Confirm the build performs no runtime `fonts.gstatic.com` request from `lib/og.tsx`.

## Boundaries

- Do NOT substitute a different font, weight, subset, or file format.
- Do NOT use `next/font` inside `ImageResponse`; keep explicit font bytes for Satori.
- Do NOT base64-inline the TTF files into TypeScript.
- Do NOT remove the asset cache or logo data URI.
- Do NOT add dependencies.
- The two binary files must match the pinned hashes exactly.
- STOP if `lib/og.tsx` has drifted from commit `bfed31a` or a font hash differs.

## Verification

- **Mechanical**:
  - `shasum -a 256 public/fonts/inter-og-regular.ttf public/fonts/inter-og-bold.ttf` matches both pinned hashes.
  - `npx vitest run tests/unit/og.test.ts`, `npm run types:check`, `npm run lint`, and `npm run build` pass.
  - `rg -n "fonts\\.gstatic\\.com|FONT_.*_URL|fetch\\(FONT" lib/og.tsx` returns no matches.
  - `npx react-doctor@latest --scope changed` does not lower the score.
- **Behavior check**: Render the home and docs OG PNGs at 1200×630, inspect title/description wrapping and logo placement, and compare them side-by-side with the pre-change images. They must be visually unchanged. Temporarily block `fonts.gstatic.com` and confirm OG generation still succeeds.
- **Done when**: OG generation uses only repository-owned assets, pinned font integrity is verified, the build no longer depends on Google Fonts for these routes, and generated images remain visually equivalent.
