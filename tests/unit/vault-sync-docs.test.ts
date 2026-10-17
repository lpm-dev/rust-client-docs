import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const reference = readFileSync("content/docs/reference/lpm-json.mdx", "utf8");
const vaultGuide = readFileSync("content/docs/infra/secrets-vault.mdx", "utf8");
const envSyncSection = reference
  .split("## Env sync state")[1]
  ?.split("\n## ")[0];

describe("env sync state documentation", () => {
  it("documents the authoritative account and revision bindings", () => {
    expect(envSyncSection).toBeDefined();
    expect(envSyncSection).toContain(".lpm/env-sync.json");
    expect(envSyncSection).toContain('"authorityCheckpoints"');
    expect(envSyncSection).toContain('"personalPlatformBindings"');
    expect(envSyncSection).toMatch(/non-authoritative summaries/i);
    expect(envSyncSection).toMatch(/remov\w+.*rollback.*account[- ]binding/is);
    expect(envSyncSection).toContain("### `vaultSync` from earlier releases");
    expect(vaultGuide).toMatch(/authority checkpoints/i);
    expect(vaultGuide).toMatch(/remov\w+.*rollback.*account[- ]binding/is);
  });
});

const envGuide = readFileSync("content/docs/dev/env.mdx", "utf8");

describe("env metadata warning recovery", () => {
  it("explains successful value sync, last valid schema retention, and client upgrade recovery", () => {
    expect(envGuide).toContain("env_metadata_dropped");
    expect(envGuide).toContain("last valid schema");
    expect(envGuide).toMatch(/older clients.*sync.*values/i);
    expect(envGuide).toMatch(/dashboard.*banner/i);
    expect(envGuide).toContain("lpm env schema --json");
    expect(envGuide).toContain("lpm env check");
  });
});
