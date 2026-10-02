import type { PostHog } from "posthog-js";
import {
  getLandingAttribution,
  normalizeAnalyticsProperties,
} from "@/lib/posthog/attribution";

let posthogPromise: Promise<PostHog | null> | null = null;

export function getPostHogClient(): Promise<PostHog | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return Promise.resolve(null);

  if (!posthogPromise) {
    posthogPromise = import("posthog-js")
      .then(({ default: posthog }) => {
        let hasFullConsent = false;
        try {
          hasFullConsent =
            window.localStorage.getItem("cookie_consent") === "granted";
        } catch {
          /* Storage may be unavailable. */
        }

        posthog.init(key, {
          api_host: "/a",
          ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
          capture_pageview: false,
          capture_pageleave: true,
          autocapture: false,
          person_profiles: "identified_only",
          capture_exceptions: true,
          persistence: hasFullConsent ? "localStorage+cookie" : "memory",
          cookieless_mode: hasFullConsent ? undefined : "always",
          before_send: (event) =>
            event
              ? {
                  ...event,
                  properties: normalizeAnalyticsProperties(
                    event.properties,
                    window.location.hostname,
                  ),
                  ...(event.$set_once
                    ? {
                        $set_once: normalizeAnalyticsProperties(
                          event.$set_once,
                          window.location.hostname,
                        ),
                      }
                    : {}),
                }
              : null,
          disable_session_recording: !hasFullConsent,
          session_recording: {
            maskAllInputs: true,
          },
          disable_surveys: true,
        });

        posthog.register({
          ...getLandingAttribution(),
          app: "cli",
          attribution_version: 2,
          analytics_mode: hasFullConsent ? "consented" : "cookieless",
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
