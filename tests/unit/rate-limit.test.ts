import { describe, expect, it } from "vitest";
import {
  clientRateLimitPartition,
  createFixedWindowRateLimiter,
  docsSearchRateLimitPolicy,
  rateLimitHeaders,
} from "../../lib/rate-limit";

describe("fixed-window rate limiter", () => {
  it("rejects requests after the quota and resets in the next window", () => {
    const limiter = createFixedWindowRateLimiter({
      quota: 2,
      windowSeconds: 60,
    });

    expect(limiter.consume("agent", 10_000)).toMatchObject({
      allowed: true,
      remaining: 1,
      resetAfterSeconds: 50,
    });
    expect(limiter.consume("agent", 20_000)).toMatchObject({
      allowed: true,
      remaining: 0,
      resetAfterSeconds: 40,
    });
    expect(limiter.consume("agent", 30_000)).toMatchObject({
      allowed: false,
      remaining: 0,
      resetAfterSeconds: 30,
    });
    expect(limiter.consume("agent", 60_000)).toMatchObject({
      allowed: true,
      remaining: 1,
      resetAfterSeconds: 60,
    });
  });

  it("keeps quotas separate for each client source", () => {
    const limiter = createFixedWindowRateLimiter({
      quota: 1,
      windowSeconds: 60,
    });

    expect(limiter.consume("agent-a", 1).allowed).toBe(true);
    expect(limiter.consume("agent-a", 2).allowed).toBe(false);
    expect(limiter.consume("agent-b", 2).allowed).toBe(true);
  });

  it("uses proxy client headers without publishing the partition key", () => {
    const request = new Request("https://cli.lpm.dev/api/v1/search", {
      headers: {
        "cf-connecting-ip": "192.0.2.1",
        "x-forwarded-for": "198.51.100.1, 198.51.100.2",
      },
    });
    const decision = {
      allowed: true,
      limit: 60,
      remaining: 42,
      resetAfterSeconds: 30,
      resetAtUnixSeconds: 1787533200,
    };

    expect(clientRateLimitPartition(request)).toBe("192.0.2.1");

    const headers = rateLimitHeaders(docsSearchRateLimitPolicy, decision);
    expect(headers.get("RateLimit-Policy")).toBe('"docs-search";q=60;w=60');
    expect(headers.get("RateLimit")).toBe('"docs-search";r=42;t=30');
    expect(headers.get("X-RateLimit-Reset")).toBe("1787533200");
    expect([...headers.values()].join(" ")).not.toContain("192.0.2.1");
  });
});
