# 010 — Remove dead server-side PostHog code

- **Status**: DONE
- **Commit**: bfed31a
- **Severity**: LOW
- **Category**: Maintainability & architecture
- **Rule**: deslop/unused-file
- **Estimated scope**: 4 files including lockfile, 62 deleted source lines

## Problem

React Doctor reports both `lib/posthog/server.ts` and `lib/posthog/track.ts` as unreachable from every application, test, script, and framework entry point. The only import of the server module is from the equally unreachable tracking module:

    // lib/posthog/server.ts:1 — current orphan
    import "server-only";
    import { PostHog } from "posthog-node";

    export const posthog = process.env.NEXT_PUBLIC_POSTHOG_KEY
      ? new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
          host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
          flushAt: 1,
          flushInterval: 0,
        })
      : null;

    // lib/posthog/track.ts:1 — only orphan-to-orphan edge
    import { posthog } from "@/lib/posthog/server";

`posthog-node` at `package.json:29` is a direct dependency whose only source consumer is this dead pair. Browser analytics uses `posthog-js` and must remain.

React Doctor's canonical `deslop/unused-file` recipe says to confirm the modules are truly orphaned, delete them, and remove dependencies for which they were the last consumer. Repository-wide basename/import searches and `npm ls posthog-node --all` confirm that exact case.

## Target

Delete these files completely:

    lib/posthog/server.ts
    lib/posthog/track.ts

Remove only the direct server SDK dependency and let npm update the lockfile:

    // package.json dependencies — target excerpt
    "next": "16.2.9",
    "posthog-js": "^1.386.8",
    "react": "^19.2.7",

The following browser files and dependencies remain unchanged:

    components/posthog-provider.tsx
    lib/posthog/client.ts
    posthog-js
    @posthog/nextjs-config

## Repo conventions to follow

- Use npm to remove the dependency so `package.json` and `package-lock.json` stay synchronized.
- Preserve the lazy browser analytics path and Next/PostHog build configuration.
- Treat deletions as the canonical dead-code fix; do not invent replacement abstractions.

## Steps

1. Search for `posthog/server`, `posthog/track`, `trackEvent`, `trackError`, `posthog-node`, and both basenames, including tests, scripts, and computed import strings.
2. If the only source references remain the orphan pair, delete both files.
3. Run `npm uninstall posthog-node` to remove the direct dependency and update `package-lock.json`.
4. Confirm npm still resolves `posthog-js` and `@posthog/nextjs-config` normally.
5. Re-run import searches and inspect the lockfile diff for unrelated dependency churn.

## Boundaries

- Do NOT remove or change `posthog-js`, `@posthog/nextjs-config`, `lib/posthog/client.ts`, `components/posthog-provider.tsx`, or `/a` rewrites.
- Do NOT replace the dead files with stubs.
- Do NOT add a new server analytics consumer merely to make the files reachable.
- Do NOT remove `server-only` if another live module uses it; this plan deletes only the two named files.
- STOP if any real importer has appeared since commit `bfed31a`; report the drift rather than deleting reachable code.

## Verification

- **Mechanical**:
  - `rg -n "posthog/(server|track)|trackEvent|trackError|posthog-node" . --glob '!node_modules/**' --glob '!.next/**'` returns no source/package matches.
  - `npm ls posthog-node --all` shows no direct installed package unless it is now required transitively by another retained dependency.
  - `npm run test:unit`, `npm run test:components`, `npm run types:check`, `npm run lint`, and `npm run build` pass.
  - Run `npx react-doctor@latest --scope changed` and confirm no score regression.
  - Because `deslop/unused-file` is full-scan-only, also run `npx react-doctor@latest --json` and confirm neither deleted path is reported.
- **Behavior check**: With browser PostHog configured, load `/`, navigate between docs pages, and confirm `$pageview` still reaches the `/a` proxy. Confirm the build still applies PostHog source-map configuration when its build-time keys are present.
- **Done when**: both orphan modules and their last direct dependency are gone, browser analytics remains operational, and the full scan clears both unused-file diagnostics.
