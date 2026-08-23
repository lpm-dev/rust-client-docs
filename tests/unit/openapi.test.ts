import { describe, expect, it } from "vitest";
import { GET } from "../../app/openapi.json/route";
import { openApiDocument } from "../../lib/openapi";

function resolveLocalRef(root: unknown, reference: string): unknown {
  return reference
    .slice(2)
    .split("/")
    .reduce<unknown>((value, segment) => {
      if (!value || typeof value !== "object") return undefined;
      return (value as Record<string, unknown>)[segment];
    }, root);
}

describe("OpenAPI specification", () => {
  it("publishes an OpenAPI 3.1 JSON document", async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(body.openapi).toBe("3.1.1");
    expect(body.info.title).toContain("LPM CLI");
    expect(body.info.license.identifier).toBe("MIT");
    expect(body.security).toEqual([]);
    expect(body.paths["/api/search"].get.operationId).toBe(
      "searchLpmCliDocumentation",
    );
    expect(body.paths["/api/search"].get.responses["500"].$ref).toBe(
      "#/components/responses/InternalError",
    );
  });

  it("resolves every local reference", () => {
    const references =
      JSON.stringify(openApiDocument).matchAll(/"\$ref":"(#[^"]+)"/g);

    for (const [, reference] of references) {
      expect(
        resolveLocalRef(openApiDocument, reference),
        `Unresolved OpenAPI reference: ${reference}`,
      ).toBeDefined();
    }
  });
});
