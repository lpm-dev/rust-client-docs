// Next's server sets up its globals with this module before anything else, and
// its routing helper below needs them.
import "next/dist/server/node-environment-baseline.js";
import type { NextConfig } from "next";
import {
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants.js";
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import nextConfigForPhase from "../../next.config.mjs";

const POSTHOG_HOST = "https://eu.i.posthog.com";
const POSTHOG_QUERY = "ip=0&_=1763600000000&ver=1.450.0&compression=gzip-js";

describe.each([PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER])(
  "routing in the %s phase",
  (phase) => {
    let nextConfig: NextConfig;

    beforeAll(async () => {
      nextConfig = await nextConfigForPhase(phase, { defaultConfig: {} });
    });

    beforeEach(() => {
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", POSTHOG_HOST);
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    function resolve(path: string) {
      return unstable_getResponseFromNextConfig({
        nextConfig,
        url: `https://cli.lpm.dev${path}`,
      });
    }

    it.each(["/i/v0/e", "/e", "/flags"])(
      "proxies PostHog's %s endpoint with or without a trailing slash",
      async (endpoint) => {
        for (const path of [`/a${endpoint}`, `/a${endpoint}/`]) {
          const response = await resolve(`${path}?${POSTHOG_QUERY}`);

          expect(response.status).toBe(200);
          expect(response.headers.get("location")).toBeNull();
          expect(response.headers.get("x-middleware-rewrite")).toBe(
            `${POSTHOG_HOST}${endpoint}?${POSTHOG_QUERY}`,
          );
        }
      },
    );

    it.each([
      [
        "/docs/packages/install/?source=search",
        "/docs/packages/install?source=search",
      ],
      ["/docs/", "/docs"],
      ["/api/search/", "/api/search"],
      ["/about/", "/about"],
    ])(
      "permanently redirects %s to its canonical URL",
      async (path, canonical) => {
        const response = await resolve(path);

        expect(response.status).toBe(308);
        expect(response.headers.get("location")).toBe(
          `https://cli.lpm.dev${canonical}`,
        );
      },
    );
  },
);
