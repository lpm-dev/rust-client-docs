import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

// Captured when `next build` evaluates this config. The value is then inlined
// into `process.env.BUILD_TIME` everywhere it's read (sitemap, etc.). If
// BUILD_TIME is already set in the environment (e.g. by CI), prefer that.
const RESOLVED_BUILD_TIME = process.env.BUILD_TIME || new Date().toISOString();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  env: {
    BUILD_TIME: RESOLVED_BUILD_TIME,
  },
  async rewrites() {
    // PostHog reverse-proxy. Routes `/a/*` from the docs origin to the
    // configured PostHog ingest host so ad blockers don't drop our events.
    // The asset host is derived from the ingest host:
    //   eu.i.posthog.com -> eu-assets.i.posthog.com
    //   us.i.posthog.com -> us-assets.i.posthog.com
    const posthogHost =
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
    const posthogAssetHost = posthogHost.replace(
      /\/\/(\w+)\.i\.posthog/,
      "//$1-assets.i.posthog",
    );

    return [
      {
        source: "/a/static/:path*",
        destination: `${posthogAssetHost}/static/:path*`,
      },
      {
        source: "/a/:path*",
        destination: `${posthogHost}/:path*`,
      },
    ];
  },
};

const baseConfig = withMDX(config);

let finalConfig = baseConfig;
if (process.env.POSTHOG_PERSONAL_API_KEY && process.env.POSTHOG_PROJECT_ID) {
  const { withPostHogConfig } = await import("@posthog/nextjs-config");
  finalConfig = withPostHogConfig(baseConfig, {
    personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY,
    projectId: process.env.POSTHOG_PROJECT_ID,
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
  });
}

export default finalConfig;
