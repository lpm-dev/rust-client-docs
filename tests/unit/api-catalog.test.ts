import { describe, expect, it } from "vitest";
import { GET } from "../../app/.well-known/api-catalog/route";
import { siteUrl } from "../../lib/shared";

describe("api catalog", () => {
  it("serves an RFC 9264 linkset as application/linkset+json", async () => {
    const response = GET();

    expect(response.headers.get("Content-Type")).toContain(
      "application/linkset+json",
    );
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");

    const body = await response.json();
    const [catalog, site] = body.linkset;

    expect(catalog.anchor).toBe(`${siteUrl}/.well-known/api-catalog`);
    const hrefs = catalog.item.map((entry: { href: string }) => entry.href);
    expect(hrefs).toContain(`${siteUrl}/llms.txt`);
    expect(hrefs).toContain(`${siteUrl}/llms-full.txt`);
    expect(hrefs).toContain(`${siteUrl}/docs.mdx`);

    expect(site["service-doc"][0].href).toBe(`${siteUrl}/docs`);
    expect(site.describedby[0].href).toBe(`${siteUrl}/llms.txt`);
  });

  it("only advertises absolute URLs on the canonical origin", async () => {
    const body = await GET().json();

    const hrefs = body.linkset.flatMap(
      (context: Record<string, unknown>) =>
        Object.values(context).filter(Array.isArray).flat() as {
          href: string;
        }[],
    );

    expect(hrefs.length).toBeGreaterThan(0);
    for (const { href } of hrefs) {
      expect(href).toMatch(new RegExp(`^${siteUrl}/`));
    }
  });
});
