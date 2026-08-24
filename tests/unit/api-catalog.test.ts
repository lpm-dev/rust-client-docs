import { describe, expect, it } from "vitest";
import { GET, HEAD } from "../../app/.well-known/api-catalog/route";
import { siteUrl } from "../../lib/shared";

describe("api catalog", () => {
  it("serves an RFC 9264 linkset as application/linkset+json", async () => {
    const response = GET();

    expect(response.headers.get("Content-Type")).toContain(
      "application/linkset+json",
    );
    expect(response.headers.get("Link")).toContain('rel="item"');

    const body = await response.json();
    const [catalog, searchApi, site] = body.linkset;

    expect(catalog.anchor).toBe(`${siteUrl}/.well-known/api-catalog`);
    const hrefs = catalog.item.map((entry: { href: string }) => entry.href);
    expect(hrefs).toEqual([`${siteUrl}/api/v1/search`]);

    expect(searchApi.anchor).toBe(`${siteUrl}/api/v1/search`);
    expect(searchApi["service-desc"][0].href).toBe(`${siteUrl}/openapi.json`);
    expect(searchApi["service-doc"][0].href).toBe(
      `${siteUrl}/docs/developer-resources`,
    );
    expect(site.describedby[0].href).toBe(`${siteUrl}/llms.txt`);
  });

  it("advertises the API links on HEAD requests", () => {
    const response = HEAD();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain(
      "application/linkset+json",
    );
    expect(response.headers.get("Link")).toContain(
      `<${siteUrl}/openapi.json>; rel="service-desc"`,
    );
    expect(response.body).toBeNull();
  });

  it("only advertises absolute URLs on the canonical origin", async () => {
    const body = await GET().json();

    const hrefs = body.linkset.flatMap((context: Record<string, unknown>) =>
      Object.values(context)
        .filter(Array.isArray)
        .flat()
        .filter((entry): entry is { href: string } =>
          Boolean(entry && typeof entry === "object" && "href" in entry),
        ),
    );

    expect(hrefs.length).toBeGreaterThan(0);
    for (const { href } of hrefs) {
      expect(href).toMatch(new RegExp(`^${siteUrl}/`));
    }
  });
});
