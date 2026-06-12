import { describe, expect, it } from "vitest";
import { GET } from "../../app/llms.mdx/home/route";
import { FEATURES, INSTALL_CMD, MORE } from "../../lib/home-content";
import { appName, siteUrl } from "../../lib/shared";

describe("markdown homepage", () => {
  it("mirrors the homepage data as markdown", async () => {
    const response = GET();
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );

    const body = await response.text();
    expect(body).toContain(`# ${appName} (${siteUrl})`);
    expect(body).toContain(INSTALL_CMD);
    for (const feature of [...FEATURES, ...MORE]) {
      expect(body).toContain(`### ${feature.title}`);
      expect(body).toContain(feature.body);
    }
  });

  it("links every feature to its absolute docs URL", async () => {
    const body = await GET().text();

    for (const feature of [...FEATURES, ...MORE]) {
      expect(body).toContain(`(${siteUrl}${feature.href})`);
    }
  });
});
