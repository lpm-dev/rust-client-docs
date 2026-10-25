import { PHASE_PRODUCTION_SERVER } from "next/constants.js";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config.mjs";

const config = await nextConfig(PHASE_PRODUCTION_SERVER, {
  defaultConfig: {},
});

describe("documentation redirects", () => {
  it.each([
    ["/docs/packages/ci", "/docs/packages/install"],
    ["/docs/packages/ci.mdx", "/docs/packages/install.mdx"],
    ["/docs/reference/lockb-format", "/docs/reference/lockfile-format"],
    ["/docs/reference/lockb-format.mdx", "/docs/reference/lockfile-format.mdx"],
    ["/docs/packages/free-distribution", "/docs/packages/package-distribution"],
    [
      "/docs/packages/free-distribution.mdx",
      "/docs/packages/package-distribution.mdx",
    ],
    ["/docs/infra/dependency-graph", "/docs/packages/dependency-graph"],
    ["/docs/infra/dependency-graph.mdx", "/docs/packages/dependency-graph.mdx"],
  ])("permanently redirects %s to %s", async (source, destination) => {
    if (!config.redirects) throw new Error("Next config redirects are missing");
    const redirects = await config.redirects();

    expect(redirects).toContainEqual({
      source,
      destination,
      permanent: true,
    });
  });
});
