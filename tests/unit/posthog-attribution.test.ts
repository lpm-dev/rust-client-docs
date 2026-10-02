import { describe, expect, it } from "vitest";
import {
  landingAttribution,
  normalizeAnalyticsProperties,
  safeAnalyticsUrl,
} from "@/lib/posthog/attribution";

describe("acquisition attribution", () => {
  it("keeps external acquisition and marks unresolved self-referrals", () => {
    const clean = normalizeAnalyticsProperties(
      {
        $referrer: "https://lpm.dev/docs?token=secret",
        $referring_domain: "lpm.dev",
        $initial_referrer: "https://www.google.com/search?q=private",
        $initial_referring_domain: "www.google.com",
      },
      "lpm.dev",
    );
    expect(clean.$referrer).toBe("$direct");
    expect(clean.$initial_referring_domain).toBe("www.google.com");
    expect(clean.$initial_referrer).toBe("https://www.google.com/search");
    expect(clean.attribution_continuity).toBe(
      "internal_referrer_without_external_source",
    );
  });
  it("records organic entry without the landing query", () => {
    expect(
      landingAttribution(
        "https://lpm.dev/docs?token=private",
        "https://www.bing.com/search?q=registry",
      ),
    ).toEqual({
      landing_path: "/docs",
      landing_source: "www.bing.com",
      landing_medium: "organic",
      is_test_traffic: false,
    });
  });
  it("keeps campaign attribution but removes credentials, auth queries, and fragments", () => {
    expect(
      safeAnalyticsUrl(
        "https://user:password@lpm.dev/callback?code=secret&utm_source=bing&utm_medium=organic#token",
      ),
    ).toBe("https://lpm.dev/callback?utm_source=bing&utm_medium=organic");
  });
});
