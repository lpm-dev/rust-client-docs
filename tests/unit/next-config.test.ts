import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "../../next.config.mjs";

const context = { defaultConfig: {} };

describe("next config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    PHASE_PRODUCTION_SERVER,
    PHASE_PRODUCTION_BUILD,
    PHASE_DEVELOPMENT_SERVER,
  ])("gives Next an object in the %s phase", async (phase) => {
    const config = await nextConfig(phase, context);
    expect(typeof config).toBe("object");
    expect(typeof config.redirects).toBe("function");
  });

  it("gives Next an object when the build uploads source maps to PostHog", async () => {
    vi.stubEnv("POSTHOG_PERSONAL_API_KEY", "phx_test");
    vi.stubEnv("POSTHOG_PROJECT_ID", "1");

    const config = await nextConfig(PHASE_PRODUCTION_BUILD, context);

    expect(typeof config).toBe("object");
    expect(typeof config.redirects).toBe("function");
    // The webpack build uploads through PostHog's webpack hook.
    expect(typeof config.webpack).toBe("function");
  });
});
