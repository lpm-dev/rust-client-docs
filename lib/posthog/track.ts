import { posthog } from "@/lib/posthog/server";

/**
 * Fire-and-forget server-side event tracking.
 * No-ops when PostHog is not configured (e.g. local dev without env vars).
 */
export function trackEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (!posthog) return;

  try {
    posthog.capture({
      distinctId: userId,
      event,
      properties,
    });
  } catch (err) {
    console.error("PostHog tracking error:", err);
  }
}

/**
 * Fire-and-forget server-side error tracking using PostHog's $exception format.
 * Errors appear in PostHog's Error Tracking dashboard.
 */
export function trackError(
  error: Error,
  context: { userId?: string; source?: string; [key: string]: unknown } = {},
): void {
  if (!posthog) return;

  const { userId, source, ...extra } = context;

  try {
    posthog.capture({
      distinctId: userId || "anonymous",
      event: "$exception",
      properties: {
        $exception_message: error?.message,
        $exception_type: error?.name,
        $exception_stack_trace_raw: error?.stack,
        $exception_source: source,
        ...extra,
      },
    });
  } catch (err) {
    console.error("PostHog error tracking failed:", err);
  }
}
