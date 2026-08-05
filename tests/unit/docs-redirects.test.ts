import { describe, expect, it } from "vitest";
import config from "../../next.config.mjs";

describe("documentation redirects", () => {
  it.each([
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
