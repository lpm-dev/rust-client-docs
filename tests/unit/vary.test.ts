import { describe, expect, it } from "vitest";
import { appendVary, mergeVary } from "../../lib/vary.mjs";

describe("appendVary", () => {
  it("adds a field without dropping existing Vary tokens", () => {
    const headers = new Headers({ Vary: "RSC, Accept-Encoding" });

    appendVary(headers, "Accept");

    expect(headers.get("Vary")).toBe("RSC, Accept-Encoding, Accept");
  });

  it("deduplicates field names case-insensitively", () => {
    const headers = new Headers({ Vary: "Accept, RSC" });

    appendVary(headers, "accept", "RSC, Next-Router-State-Tree");

    expect(headers.get("Vary")).toBe("Accept, RSC, Next-Router-State-Tree");
  });

  it("preserves wildcard variance", () => {
    const headers = new Headers({ Vary: "*" });

    appendVary(headers, "Accept");

    expect(headers.get("Vary")).toBe("*");
  });

  it("merges Node header arrays", () => {
    expect(mergeVary(["RSC", "Accept-Encoding"], "Accept")).toBe(
      "RSC, Accept-Encoding, Accept",
    );
  });
});
