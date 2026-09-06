import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const reference = readFileSync("content/docs/reference/lpm-json.mdx", "utf8");
const vaultGuide = readFileSync("content/docs/infra/secrets-vault.mdx", "utf8");
const vaultSyncSection = reference
  .split("## `vaultSync`")[1]
  ?.split("\n## ")[0];

describe("vaultSync documentation", () => {
  it("documents the authoritative account and revision bindings", () => {
    expect(vaultSyncSection).toBeDefined();
    expect(vaultSyncSection).toContain('"authorityCheckpoints"');
    expect(vaultSyncSection).toContain('"personalPlatformBindings"');
    expect(vaultSyncSection).toMatch(/non-authoritative summaries/i);
    expect(vaultSyncSection).toMatch(
      /remov\w+.*rollback.*account[- ]binding/is,
    );
    expect(vaultGuide).toMatch(/authority checkpoints/i);
    expect(vaultGuide).toMatch(/remov\w+.*rollback.*account[- ]binding/is);
  });
});
