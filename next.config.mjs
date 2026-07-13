import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

// Captured when `next build` evaluates this config. The value is then inlined
// into `process.env.BUILD_TIME` everywhere it's read (sitemap, etc.). If
// BUILD_TIME is already set in the environment (e.g. by CI), prefer that.
const RESOLVED_BUILD_TIME = process.env.BUILD_TIME || new Date().toISOString();

// Latest published CLI version, for the SoftwareApplication JSON-LD. An
// explicit LPM_CLI_VERSION env var wins; otherwise production builds ask the
// GitHub releases API (`next dev` never waits on the network). Resolves to ""
// on any failure, which makes the schema omit softwareVersion.
async function resolveCliVersion() {
  if (process.env.LPM_CLI_VERSION) return process.env.LPM_CLI_VERSION;
  if (process.env.NODE_ENV !== "production") return "";

  try {
    const response = await fetch(
      "https://api.github.com/repos/lpm-dev/rust-client/releases/latest",
      {
        headers: { accept: "application/vnd.github+json" },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) return "";
    const release = await response.json();
    const tag = typeof release.tag_name === "string" ? release.tag_name : "";
    return tag.replace(/^v/, "");
  } catch {
    return "";
  }
}

const RESOLVED_CLI_VERSION = await resolveCliVersion();
const ONE_DAY_SECONDS = 60 * 60 * 24;
const HTML_CACHE_CONTROL = `public, max-age=0, s-maxage=${ONE_DAY_SECONDS}, stale-while-revalidate=${ONE_DAY_SECONDS}`;
const HTML_RESPONSE_HEADERS = [
  {
    key: "Cache-Control",
    value: HTML_CACHE_CONTROL,
  },
];
const LEGACY_DOCS_REDIRECTS = [
  ["/docs/configuration/config-toml", "/docs/reference/config-toml"],
  ["/docs/infra/graph", "/docs/packages/graph"],
  ["/docs/reference/authentication", "/docs/infra/authentication"],
  ["/docs/reference/completions", "/docs/dev/completions"],
  ["/docs/reference/config", "/docs/infra/config"],
  ["/docs/reference/init", "/docs/packages/init"],
  ["/docs/reference/security", "/docs/infra/security"],
  ["/docs/reference/self-update", "/docs/infra/self-update"],
];

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  env: {
    BUILD_TIME: RESOLVED_BUILD_TIME,
    LPM_CLI_VERSION: RESOLVED_CLI_VERSION,
  },
  async redirects() {
    return LEGACY_DOCS_REDIRECTS.flatMap(([source, destination]) => [
      { source, destination, permanent: true },
      {
        source: `${source}.mdx`,
        destination: `${destination}.mdx`,
        permanent: true,
      },
    ]);
  },
  async headers() {
    return [
      {
        source: "/",
        headers: HTML_RESPONSE_HEADERS,
      },
      {
        source: "/docs",
        headers: HTML_RESPONSE_HEADERS,
      },
      {
        source: "/docs/:path*",
        headers: HTML_RESPONSE_HEADERS,
      },
      {
        source: "/schemas/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=86400",
          },
          {
            key: "Content-Type",
            value: "application/schema+json; charset=utf-8",
          },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
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
