import { describe, expect, it } from "vitest";
import { GET as markdown404Get } from "../../app/404.md/route";
import {
  markdownNotFoundResponse,
  notFoundMarkdown,
} from "../../lib/not-found-response";

describe("agent-friendly 404 responses", () => {
  it("returns markdown recovery links with a real 404 status", async () => {
    const response = markdownNotFoundResponse("/missing-page");
    const body = await response.text();

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toContain("# 404: LPM CLI resource not found");
    expect(body).toContain("https://cli.lpm.dev/sitemap.xml");
    expect(body).toContain("https://cli.lpm.dev/llms.txt");
    expect(body).toContain("https://cli.lpm.dev/openapi.json");
  });

  it("serves a requested missing path as markdown", async () => {
    const request = new Request(
      "https://cli.lpm.dev/404.md?path=%2Fno-such-page",
    );
    const response = markdown404Get(request);

    expect(response.status).toBe(404);
    expect(await response.text()).toBe(notFoundMarkdown("/no-such-page"));
  });
});
