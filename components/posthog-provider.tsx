"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { getPostHogClient } from "@/lib/posthog/client";

/**
 * Schedules a callback when the browser is idle, with a maximum wait timeout.
 * Falls back to immediate execution when requestIdleCallback is unavailable.
 * Returns a cleanup function that cancels the pending callback.
 */
function scheduleWhenIdle(fn: () => void, timeout: number): () => void {
  if (typeof requestIdleCallback !== "undefined") {
    const id = requestIdleCallback(fn, { timeout });
    return () => cancelIdleCallback(id);
  }
  fn();
  return () => {};
}

/**
 * Tracks pageviews on navigation, deferred until idle so route transitions
 * render uncontested. 2s timeout keeps pageview accuracy acceptable.
 *
 * Wrapped in its own Suspense boundary in the parent so useSearchParams()
 * doesn't bubble suspense into <head>.
 */
function PostHogPageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  return null;
}

/**
 * PostHog provider for cli.lpm.dev. Anonymous-by-default (memory persistence)
 * so we don't need a consent banner for Phase A. Docs has no authenticated
 * user surface — identification happens on lpm.dev where users log in.
 */
export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense>
        <PostHogPageviewTracker />
      </Suspense>
      {children}
    </>
  );
}
