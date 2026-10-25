import { afterEach, describe, expect, it } from "vitest";
import { readinessResponse } from "@/lib/readiness";
import { startDraining, stopDraining } from "@/server-drain.mjs";

describe("readinessResponse", () => {
  afterEach(stopDraining);

  it("reports ready until the server drains", async () => {
    const ready = readinessResponse();
    expect(ready.status).toBe(200);
    expect(ready.headers.get("cache-control")).toBe("no-store");
    expect(await ready.json()).toEqual({ status: "ready" });

    startDraining();
    const draining = readinessResponse();
    expect(draining.status).toBe(503);
    expect(draining.headers.get("cache-control")).toBe("no-store");
    expect(await draining.json()).toEqual({ status: "draining" });
  });
});
