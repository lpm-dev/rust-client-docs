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
    expect(body.paths["/api/v1/search"].get.operationId).toBe(
      "searchLpmCliDocumentation",
    );
    expect(body.paths["/api/v1/search"].get["x-api-version"]).toBe("1");
    expect(body.paths["/api/v1/search"].get.responses["429"].$ref).toBe(
      "#/components/responses/RateLimited",
    );
    expect(body.paths["/api/v1/search"].get.responses["500"].$ref).toBe(
      "#/components/responses/InternalError",
    );
    expect(body.paths["/api/search"].get.deprecated).toBe(true);
    expect(body.paths["/api/search"].get.operationId).not.toBe(
      body.paths["/api/v1/search"].get.operationId,
    );
    expect(body.components.responses.SearchSuccess.headers).toHaveProperty(
      "RateLimit",
    );
    expect(body.components.responses.SearchSuccess.headers).toHaveProperty(
      "RateLimit-Policy",
    );
    expect(body.components.responses.RateLimited.headers).toHaveProperty(
      "Retry-After",
    );
    expect(
      body.components.responses.DeprecatedSearchSuccess.headers.Deprecation,
    ).toBeDefined();
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
