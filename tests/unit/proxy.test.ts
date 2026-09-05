import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import proxy from "../../proxy";

function varyTokens(response: Response): string[] {
  return (response.headers.get("Vary") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

describe("content negotiation proxy", () => {
  it.each([
    "POST",
    "OPTIONS",
  ])("returns a controlled 405 for schema %s requests", async (method) => {
    const response = proxy(
      new NextRequest("https://cli.lpm.dev/schemas/lpm.json", { method }),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, HEAD");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Type")).toContain(
      "application/problem+json",
    );
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
    await expect(response.json()).resolves.toMatchObject({
      code: "METHOD_NOT_ALLOWED",
      status: 405,
    });
  });

  it("varies extensionless HTML docs on Accept", () => {
    const response = proxy(
      new NextRequest("https://cli.lpm.dev/docs/packages/install", {
        headers: { Accept: "text/html" },
      }),
    );

    expect(varyTokens(response)).toContain("accept");
    expect(response.headers.get("Link")).toContain(
      '</docs/packages/install.mdx>; rel="alternate"; type="text/markdown"',
    );
  });

  it("varies negotiated markdown docs on Accept", () => {
    const response = proxy(
      new NextRequest("https://cli.lpm.dev/docs/packages/install", {
        headers: { Accept: "text/markdown" },
      }),
    );

    expect(varyTokens(response)).toContain("accept");
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://cli.lpm.dev/llms.mdx/docs/packages/install/content.md",
    );
  });

  it("keeps the explicit .mdx route independent of Accept negotiation", () => {
    const response = proxy(
      new NextRequest("https://cli.lpm.dev/docs/packages/install.mdx", {
        headers: { Accept: "text/html" },
      }),
    );

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://cli.lpm.dev/llms.mdx/docs/packages/install/content.md",
    );
    expect(response.headers.get("Link")).toBe(
      '</docs/packages/install>; rel="alternate"; type="text/html"',
    );
  });
});
