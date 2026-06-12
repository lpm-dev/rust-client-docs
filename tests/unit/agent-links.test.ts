import { describe, expect, it } from "vitest";
import { agentLinkHeader } from "../../lib/agent-links";

describe("agentLinkHeader", () => {
  it("advertises the api catalog, docs, llms.txt, and markdown twin on the homepage", () => {
    const header = agentLinkHeader("/");

    expect(header).toContain(
      '</llms.mdx/home>; rel="alternate"; type="text/markdown"',
    );
    expect(header).toContain('</.well-known/api-catalog>; rel="api-catalog"');
    expect(header).toContain('</docs>; rel="service-doc"');
    expect(header).toContain(
      '</llms.txt>; rel="describedby"; type="text/markdown"',
    );
  });

  it("points docs pages at their markdown mirror", () => {
    expect(agentLinkHeader("/docs/packages/install")).toBe(
      '</docs/packages/install.mdx>; rel="alternate"; type="text/markdown", ' +
        '</.well-known/api-catalog>; rel="api-catalog"',
    );
  });

  it("handles the docs root and trailing slashes", () => {
    expect(agentLinkHeader("/docs")).toContain("</docs.mdx>");
    expect(agentLinkHeader("/docs/")).toContain("</docs.mdx>");
    expect(agentLinkHeader("/docs/installation/")).toContain(
      "</docs/installation.mdx>",
    );
  });

  it("skips markdown mirror paths", () => {
    expect(agentLinkHeader("/docs/packages/install.mdx")).toBeUndefined();
  });

  it("returns nothing for non-advertised routes", () => {
    expect(agentLinkHeader("/llms.txt")).toBeUndefined();
    expect(agentLinkHeader("/api/search")).toBeUndefined();
    expect(agentLinkHeader("/docsfoo")).toBeUndefined();
  });
});
