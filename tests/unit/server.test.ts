import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { negotiatesOnAccept } from "../../server.mjs";

describe("final response variance", () => {
  it.each([
    "/",
    "/docs",
    "/docs/packages/install",
    "/docs/packages/install?source=test",
    "/not-a-real-page",
    "/not/a/real/page",
  ])("marks %s as content negotiated", (url) => {
    expect(negotiatesOnAccept(url)).toBe(true);
  });

  it.each([
    "/docs/packages/install.mdx",
    "/llms.mdx/docs/packages/install/content.md",
    "/openapi.json",
    "/schemas/lpm.json",
    "/api/v1/search",
    "/og/home",
    "/.well-known/api-catalog",
    "/install",
  ])("does not mark the fixed representation %s", (url) => {
    expect(negotiatesOnAccept(url)).toBe(false);
  });

  it("starts the custom server with the production environment", () => {
    const packageJson = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
    );

    expect(packageJson.scripts.start).toBe(
      "NODE_ENV=production node server.mjs",
    );
  });
});
