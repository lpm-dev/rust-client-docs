import { describe, expect, it } from "vitest";
import {
  apiProblem,
  apiRouteNotFound,
  methodNotAllowed,
} from "../../lib/api-problem";

describe("API Problem Details", () => {
  it("returns RFC 9457 fields and agent recovery fields", async () => {
    const request = new Request("https://cli.lpm.dev/api/missing?secret=hide");
    const response = apiRouteNotFound(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe(
      "application/problem+json; charset=utf-8",
    );
    expect(body).toMatchObject({
      type: "about:blank",
      title: "API route not found",
      status: 404,
      instance: "/api/missing",
      code: "API_ROUTE_NOT_FOUND",
      documentation_url: "https://cli.lpm.dev/docs/developer-resources",
    });
    expect(body.message).toBeTypeOf("string");
    expect(body.resolution).toContain("https://cli.lpm.dev/openapi.json");
    expect(JSON.stringify(body)).not.toContain("secret=hide");
  });

  it("adds an Allow header to method errors", async () => {
    const response = methodNotAllowed(["GET"])(
      new Request("https://cli.lpm.dev/api/search", { method: "POST" }),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET");
    expect((await response.json()).code).toBe("METHOD_NOT_ALLOWED");
  });

  it("uses the supplied safe message as the problem detail", async () => {
    const response = apiProblem(new Request("https://cli.lpm.dev/api/search"), {
      status: 500,
      code: "SEARCH_FAILED",
      title: "Documentation search failed",
      message: "The search did not complete.",
      resolution: "Retry the request.",
    });

    const body = await response.json();
    expect(body.detail).toBe("The search did not complete.");
    expect(body.message).toBe(body.detail);
  });
});
