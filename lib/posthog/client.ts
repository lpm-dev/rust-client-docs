import type { PostHog } from "posthog-js";

let posthogPromise: Promise<PostHog | null> | null = null;

/**
 * Lazily loads and initializes PostHog on first call.
 *
 * Always initializes with `persistence: "memory"` so anonymous per-session
 * tracking works without a consent prompt. When the user explicitly grants
 * consent (`localStorage.cookie_consent === "granted"`) persistence is
 * upgraded to `localStorage+cookie` for cross-session identity and session
 * recording.
 *
 * Shares the same PostHog project as lpm.dev — segment by `$host` when you
 * need docs-only views.
 */
export function getPostHogClient(): Promise<PostHog | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return Promise.resolve(null);

  if (!posthogPromise) {
    posthogPromise = import("posthog-js")
      .then(({ default: posthog }) => {
        const hasFullConsent =
          window.localStorage.getItem("cookie_consent") === "granted";

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

  return posthogPromise;
}
