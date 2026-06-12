import { describe, expect, it } from "vitest";
import { GET } from "../../app/robots.txt/route";
import { siteUrl } from "../../lib/shared";

describe("robots.txt", () => {
  it("declares content signals inside the wildcard group", async () => {
    const body = await GET().text();

    const group = body.slice(body.indexOf("User-agent: *"));
    expect(group).toContain(
      "Content-Signal: search=yes, ai-input=yes, ai-train=yes",
    );
  });

  it("keeps the crawl rules, host, and sitemap from the previous output", async () => {
    const body = await GET().text();

    expect(body).toContain("User-agent: *");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Disallow: /api/");
    expect(body).toContain("Disallow: /a/");
    expect(body).toContain(`Host: ${siteUrl}`);
    expect(body).toContain(`Sitemap: ${siteUrl}/sitemap.xml`);
    expect(body).not.toContain("Disallow: /og/");
  });
});
