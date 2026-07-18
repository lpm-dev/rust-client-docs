# 009 — Remove the unused MDX export

- **Status**: DONE
- **Commit**: bfed31a
- **Severity**: LOW
- **Category**: Maintainability & architecture
- **Rule**: deslop/unused-export
- **Estimated scope**: 1 file, 1 deleted line

## Problem

React Doctor reports `components/mdx.tsx:11` because `useMDXComponents` is exported but no tracked module imports it:

    // components/mdx.tsx:4 — current
    export function getMDXComponents(components?: MDXComponents) {
      return {
        ...defaultMdxComponents,
        ...components,
      } satisfies MDXComponents;
    }

    export const useMDXComponents = getMDXComponents;

The repository-wide import search confirms only `getMDXComponents` is used, at `app/docs/[[...slug]]/page.tsx:12` and `:59`. This file is not the framework-reserved root `mdx-components.tsx`, so the alias is not a convention-based external entry point.

React Doctor's canonical `deslop/unused-export` recipe says: confirm no importer exists, then drop the export; if nothing in the file uses the declaration either, delete it outright. The alias has no local use, so deletion is the exact canonical target.

## Target

Delete the alias entirely. The complete target file is:

    import defaultMdxComponents from "fumadocs-ui/mdx";
    import type { MDXComponents } from "mdx/types";

    export function getMDXComponents(components?: MDXComponents) {
      return {
        ...defaultMdxComponents,
        ...components,
      } satisfies MDXComponents;
    }

    declare global {
      type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
    }

## Repo conventions to follow

- Preserve `getMDXComponents` as the public helper used by the docs page.
- Preserve the global `MDXProvidedComponents` type declaration and import order.
- Make no changes to MDX component merging or Fumadocs behavior.

## Steps

1. Run a repository-wide literal search for `useMDXComponents` and confirm the declaration is still the only match.
2. Delete `export const useMDXComponents = getMDXComponents;` and the now-extra blank line only.
3. Do not rename or privatize `getMDXComponents`; it has a real importer.
4. Re-read the one-line diff and remove unrelated churn.

## Boundaries

- Do NOT create a root `mdx-components.tsx` file.
- Do NOT change `getMDXComponents`'s signature or export.
- Do NOT change generated MDX types or content files.
- Do NOT add dependencies.
- STOP if an importer for `useMDXComponents` exists or the code has drifted from commit `bfed31a`; report it instead of deleting a public API.

## Verification

- **Mechanical**:
  - `rg -n "useMDXComponents" . --glob '!node_modules/**' --glob '!.next/**'` returns no matches.
  - `npm run types:check`, `npm run lint`, and `npm run build` pass.
  - Run `npx react-doctor@latest --scope changed` and confirm the score does not regress.
  - Because deslop dead-code analysis is skipped in changed-scope mode, also run a full `npx react-doctor@latest --json` scan and confirm `deslop/unused-export` no longer reports `components/mdx.tsx`.
- **Behavior check**: Open `/docs` and a nested MDX page, then confirm headings, code blocks, relative links, Markdown Copy, and View Options render and behave unchanged.
- **Done when**: the alias is absent, the real helper still compiles and renders MDX, and the full React Doctor scan clears this diagnostic.
