import { describe, expect, it } from "vitest";
import { GET as unknownApiGet } from "../../app/api/[[...path]]/route";

describe("API routes", () => {
  it("returns JSON for an unknown API route", async () => {
    const response = unknownApiGet(
      new Request("https://cli.lpm.dev/api/not-a-route"),
    );

    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe("API_ROUTE_NOT_FOUND");
  });

  it("returns JSON for the API root", async () => {
    const response = unknownApiGet(new Request("https://cli.lpm.dev/api"));

    expect(response.status).toBe(404);
    expect((await response.json()).instance).toBe("/api");
  });
});
