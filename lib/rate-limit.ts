export const docsSearchRateLimitPolicy = {
  name: "docs-search",
  quota: 60,
  windowSeconds: 60,
} as const;

type FixedWindowOptions = {
  quota: number;
  windowSeconds: number;
  maxPartitions?: number;
};

type WindowState = {
  start: number;
  used: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAfterSeconds: number;
  resetAtUnixSeconds: number;
};

export function createFixedWindowRateLimiter({
  quota,
  windowSeconds,
  maxPartitions = 10_000,
}: FixedWindowOptions) {
  if (!Number.isInteger(quota) || quota < 1) {
    throw new RangeError("The rate-limit quota must be a positive integer.");
  }
  if (!Number.isInteger(windowSeconds) || windowSeconds < 1) {
    throw new RangeError(
      "The rate-limit window must be a positive integer of seconds.",
    );
  }
  if (!Number.isInteger(maxPartitions) || maxPartitions < 1) {
    throw new RangeError(
      "The maximum rate-limit partition count must be a positive integer.",
    );
  }

  const windows = new Map<string, WindowState>();
  const windowMilliseconds = windowSeconds * 1000;

  return {
    consume(partition: string, now = Date.now()): RateLimitDecision {
      const windowStart =
        Math.floor(now / windowMilliseconds) * windowMilliseconds;
      let state = windows.get(partition);

      if (!state || state.start !== windowStart) {
        if (!state && windows.size >= maxPartitions) {
          for (const [key, value] of windows) {
            if (value.start < windowStart) windows.delete(key);
          }

          if (windows.size >= maxPartitions) {
            const oldestPartition = windows.keys().next().value;
            if (oldestPartition !== undefined) windows.delete(oldestPartition);
          }
        }

        state = { start: windowStart, used: 0 };
        windows.set(partition, state);
      }

      const allowed = state.used < quota;
      if (allowed) state.used += 1;

      const resetAt = windowStart + windowMilliseconds;
      return {
        allowed,
        limit: quota,
        remaining: Math.max(0, quota - state.used),
        resetAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
        resetAtUnixSeconds: Math.ceil(resetAt / 1000),
      };
    },
  };
}

export function clientRateLimitPartition(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0];
  const source =
    request.headers.get("cf-connecting-ip") ??
    forwarded ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  return source.trim().slice(0, 128) || "anonymous";
}

export function rateLimitHeaders(
  policy: typeof docsSearchRateLimitPolicy,
  decision: RateLimitDecision,
): Headers {
  const headers = new Headers({
    "Cache-Control": "private, no-store",
    RateLimit: `"${policy.name}";r=${decision.remaining};t=${decision.resetAfterSeconds}`,
    "RateLimit-Policy": `"${policy.name}";q=${policy.quota};w=${policy.windowSeconds}`,
    "X-RateLimit-Limit": String(decision.limit),
    "X-RateLimit-Remaining": String(decision.remaining),
    "X-RateLimit-Reset": String(decision.resetAtUnixSeconds),
  });

  return headers;
}
