# 011 — Reduce logo SVG precision

- **Status**: DONE
- **Commit**: bfed31a
- **Severity**: LOW
- **Category**: Performance
- **Rule**: react-doctor/rendering-svg-precision
- **Estimated scope**: 2 files, 8 attribute replacements

## Problem

React Doctor reports editor-level coordinate precision in the duplicated LPM logo rendered in the global header and footer:

    // components/site-header.tsx:259 — current excerpt
    d="M32.3937931,4.16206897 L28.137931,5.86206897 ..."

    // components/site-footer.tsx:34 — current excerpt
    d="M32.3937931,4.16206897 L28.137931,5.86206897 ..."

Both SVGs use a `36 36` viewBox, so four-to-eleven decimal places are far below visible pixel precision but ship in global markup and the header's client bundle on every route.

React Doctor's canonical `rendering-svg-precision` fix is to round every flagged `d`, `points`, and `transform` number to one or two decimal places. The canonical prompt recommends SVGO `cleanupNumericValues` with `precision: 2` or the equivalent exact manual trimming.

## Target

In both `LpmMark` and `LpmLogo`, use the same exact four rounded attribute values below. Keep the surrounding JSX, fills, opacity, viewBox, and `translate(1, 1)` unchanged.

    d="M32.39,4.16 L28.14,5.86 L29.84,1.61 C29.98,1.25 29.94,0.84 29.72,0.52 C29.5,0.19 29.14,0 28.75,0 L5.25,0 C4.86,0 4.5,0.19 4.28,0.52 C4.06,0.84 4.02,1.25 4.16,1.61 L5.86,5.86 L1.61,4.16 C1.25,4.02 0.84,4.06 0.52,4.28 C0.19,4.5 0,4.86 0,5.25 L0,28.75 C0,29.14 0.19,29.5 0.52,29.72 C0.84,29.94 1.25,29.98 1.61,29.84 L5.86,28.14 L4.16,32.39 C4.02,32.75 4.06,33.16 4.28,33.48 C4.5,33.81 4.86,34 5.25,34 L28.75,34 C29.14,34 29.5,33.81 29.72,33.48 C29.94,33.16 29.98,32.75 29.84,32.39 L28.14,28.14 L32.39,29.84 C32.75,29.98 33.16,29.94 33.48,29.72 C33.81,29.5 34,29.14 34,28.75 L34,5.25 C34,4.86 33.81,4.5 33.48,4.28 C33.16,4.06 32.75,4.02 32.39,4.16 Z"

    transform="translate(5.86, 5.86)"

    d="M0,0 L3.86,3.86 C3.64,4.08 3.52,4.38 3.52,4.69 L3.52,17.59 C3.52,17.9 3.64,18.2 3.86,18.41 C4.08,18.64 4.38,18.76 4.69,18.76 L17.59,18.76 C17.9,18.76 18.2,18.64 18.41,18.41 L22.28,22.28 L0,22.28 L0,0 Z"

    d="M0,0 L22.28,0 L22.28,22.28 L18.41,18.41 C18.64,18.2 18.76,17.9 18.76,17.59 L18.76,4.69 C18.76,4.42 18.67,4.17 18.5,3.96 L18.41,3.86 C18.2,3.64 17.9,3.52 17.59,3.52 L4.69,3.52 C4.38,3.52 4.08,3.64 3.86,3.86 L0,0 Z"

## Repo conventions to follow

- Keep the logo inline and decorative (`aria-hidden="true"`) in both locations.
- Preserve header color `#2376E3`, footer color props, white inner fill, and opacity.
- Apply identical coordinate strings to both copies so they cannot drift visually.
- Do not add SVGO as a dependency for this one-time canonical transformation.

## Steps

1. At `components/site-footer.tsx:34–40`, replace the four flagged attribute strings with the exact target strings.
2. At `components/site-header.tsx:259–265`, apply the identical four replacements.
3. Search both logo functions for `\d+\.\d{4,}` and confirm no flagged numeric literal remains.
4. Render header and footer logos at 1×, 2×, light theme, and dark theme; compare before and after screenshots at pixel scale.
5. Inspect the diff to ensure no path command, fill, opacity, viewBox, component API, or surrounding markup changed.

## Boundaries

- Do NOT round unrelated GitHub or X icons that React Doctor did not report.
- Do NOT extract or redesign a shared logo component in this plan.
- Do NOT replace the inline SVG with `next/image`, a public URL, canvas, or raster asset.
- Do NOT add SVGO or another dependency.
- Do NOT change path command letters or reorder coordinates.
- STOP if the logo paths have drifted from commit `bfed31a`; regenerate a reviewed precision-2 target rather than applying stale strings.

## Verification

- **Mechanical**:
  - `rg -n "[0-9]+\\.[0-9]{4,}" components/site-header.tsx components/site-footer.tsx` has no matches within `LpmLogo` or `LpmMark`.
  - `npm run types:check`, `npm run lint`, and `npm run build` pass.
  - `npx react-doctor@latest --scope changed` clears both `react-doctor/rendering-svg-precision` diagnostics and does not lower the score.
- **Behavior check**: Capture before/after screenshots of both logos at device pixel ratios 1 and 2 and confirm no visible shape change. In React DevTools Profiler with “Highlight updates,” navigate between docs routes and confirm this markup-only change adds no render or remount. Compare serialized SVG byte length and confirm it decreases.
- **Done when**: both diagnostics are clear, all logo attributes use at most two decimals, rendered output is visually unchanged, payload size drops, and checks pass.
