# 005 — Harden PostHog pageview tracking

- **Status**: DONE
- **Commit**: bfed31a
- **Severity**: MEDIUM
- **Category**: Bugs & correctness
- **Rule**: Beyond the scan
- **Estimated scope**: 3 files, about 100 lines

## Problem

`components/posthog-provider.tsx:32` cancels an idle callback, but once that callback begins it cannot cancel the pending dynamic import/initialization promise. A fast route change can therefore capture the old pathname after the component effect has already cleaned up.

    // components/posthog-provider.tsx:32 — current
    useEffect(() => {
      return scheduleWhenIdle(() => {
        getPostHogClient().then((posthog) => {
          if (!posthog) return;

          let url = window.origin + pathname;
          const qs = searchParams.toString();
          if (qs) url += `?${qs}`;
          posthog.capture("$pageview", { $current_url: url });
        });
      }, 2000);
    }, [pathname, searchParams]);

`lib/posthog/client.ts:22` also retains an unhandled rejected promise if import, storage access, or `posthog.init` fails:

    if (!posthogPromise) {
      posthogPromise = import("posthog-js").then(({ default: posthog }) => {
        // initialization
        return posthog;
      });
    }

Every later navigation attaches another rejection handler-free `.then` to that same failed promise, and analytics cannot retry.

## Target

Make effect cleanup cover both idle scheduling and an already-started async load:

    useEffect(() => {
      let cancelled = false;
      const cancelIdle = scheduleWhenIdle(() => {
        void getPostHogClient().then((posthog) => {
          if (cancelled || !posthog) return;

          let url = window.origin + pathname;
          const qs = searchParams.toString();
          if (qs) url += `?${qs}`;
          posthog.capture("$pageview", { $current_url: url });
        });
      }, 2000);

      return () => {
        cancelled = true;
        cancelIdle();
      };
    }, [pathname, searchParams]);

Make the shared client promise resolve safely and clear the cache after a load failure so a later navigation can retry:

    if (!posthogPromise) {
      posthogPromise = import("posthog-js")
        .then(({ default: posthog }) => {
          const hasFullConsent =
            localStorage.getItem("cookie_consent") === "granted";

          posthog.init(key, {
            api_host: "/a",
            ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
            capture_pageview: false,
            capture_pageleave: true,
            autocapture: false,
            person_profiles: "identified_only",
            capture_exceptions: true,
            persistence: hasFullConsent ? "localStorage+cookie" : "memory",
            disable_session_recording: !hasFullConsent,
            session_recording: {
              maskAllInputs: true,
            },
            disable_surveys: true,
          });

          return posthog;
        })
        .catch(() => {
          posthogPromise = null;
          console.error("PostHog initialization failed");
          return null;
        });
    }

The public contract remains `Promise<PostHog | null>`; callers never receive a rejection.

## Repo conventions to follow

- Preserve lazy import, module-level promise deduplication, memory persistence, and the `/a` reverse proxy.
- Use one generic initialization error message; do not log keys, URLs, exception objects, query strings, or user data.
- Use effect-local cancellation, matching the cleanup posture in `copy-button.tsx:12` and `reveal.tsx:18`.
- Use plan 001's jsdom lane for focused tests.

## Steps

1. In `posthog-provider.tsx`, replace the returned idle cleanup with the combined `cancelled` flag and `cancelIdle` cleanup shown above.
2. In `lib/posthog/client.ts`, append the exact catch that clears `posthogPromise`, logs a generic initialization failure, and resolves `null`.
3. Export no new production API solely for tests.
4. Create `tests/components/posthog-provider.test.tsx`. Mock `next/navigation` with mutable pathname/search-param values and mock `getPostHogClient` with a controllable deferred promise.
5. Test that resolving the old promise after a rerender to a new pathname does not capture the old URL, while the new effect captures exactly the new URL.
6. Add a client-module test that makes initialization reject, asserts `getPostHogClient()` resolves `null`, and confirms a later call attempts initialization again rather than reusing the rejected promise.
7. Assert failure logs exactly `PostHog initialization failed` without an exception object or PostHog key.

## Boundaries

- Do NOT change consent, persistence, session-recording, autocapture, pageleave, or exception-capture policy.
- Do NOT make analytics initialization block rendering or navigation.
- Do NOT add `AbortController`; dynamic imports and PostHog initialization are not abortable here, so suppress only the stale side effect.
- Do NOT remove browser PostHog dependencies; plan 010 concerns only unreachable server-side tracking.
- Do NOT add dependencies beyond plan 001.
- Expected test-harness drift from plan 001 is allowed; STOP on unrelated source drift from commit `bfed31a`.

## Verification

- **Mechanical**:
  - `npx vitest run tests/components/posthog-provider.test.tsx` passes deferred-resolution, route-change, rejection, and retry cases.
  - `npm run test:unit`, `npm run types:check`, and `npm run lint` pass.
  - `npx react-doctor@latest --scope changed` does not lower the score.
- **Behavior check**: With PostHog configured, throttle the network, navigate quickly between two docs pages, and confirm the Network/PostHog debugger shows only the current pageview after each effect cleanup. Block the PostHog chunk once and confirm the page remains usable without an unhandled-rejection console error; unblock it and navigate again to confirm retry.
- **Done when**: cleaned-up effects cannot capture stale URLs, initialization failures resolve safely, later calls can retry, and page rendering remains independent of analytics.
