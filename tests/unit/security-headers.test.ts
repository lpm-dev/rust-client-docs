import { describe, expect, it } from "vitest";
import config from "../../next.config.mjs";

const EXPECTED_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self' https://*.posthog.com wss://*.posthog.com",
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
].join("; ");

describe("browser security headers", () => {
  it("applies the hardened response headers to every route", async () => {
    if (!config.headers) throw new Error("Next config headers are missing");
    const rules = await config.headers();
    const globalRule = rules.find((rule) => rule.source === "/:path*");
    expect(globalRule).toBeDefined();

    const headers = Object.fromEntries(
      globalRule?.headers.map(({ key, value }) => [key, value]) ?? [],
    );
    expect(headers).toEqual({
      "Content-Security-Policy-Report-Only": EXPECTED_CSP,
      "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    });
  });

  it("does not expose the Next.js powered-by header", () => {
    expect(config.poweredByHeader).toBe(false);
  });

  it("leaves final Accept variance to the server and keeps machine endpoints out of search", async () => {
    if (!config.headers) throw new Error("Next config headers are missing");
    const rules = await config.headers();

    for (const source of ["/", "/docs", "/docs/:path*"]) {
      const rule = rules.find((candidate) => candidate.source === source);
      expect(rule?.headers).not.toContainEqual({
        key: "Vary",
        value: "Accept",
      });
    }

    const schemaRule = rules.find((rule) => rule.source === "/schemas/:path*");
    expect(schemaRule?.headers).toContainEqual({
      key: "X-Robots-Tag",
      value: "noindex",
    });

    for (const source of ["/api/v1/search", "/api/search", "/openapi.json"]) {
      const rule = rules.find((candidate) => candidate.source === source);
      expect(rule?.headers).toContainEqual({
        key: "X-Robots-Tag",
        value: "noindex",
      });
    }
  });
});
