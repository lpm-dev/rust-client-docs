import { describe, expect, it } from "vitest";
import { buildLlmsIndex } from "../../lib/llms-index";

const generatedIndex = `# Get Started

- [LPM CLI](/docs): Documentation.
`;

describe("llms.txt", () => {
  it("follows the llms.txt heading order", async () => {
    const body = buildLlmsIndex(generatedIndex);

    expect(body).toMatch(
      /^# LPM CLI developer resources\n\n> LPM CLI is a package manager/,
    );
    expect(body.match(/^# /gm)).toHaveLength(1);
    expect(body).toContain("\n## Machine-readable resources\n");
    expect(body).toContain("\n## LPM CLI documentation\n");
  });

  it("lists named developer and agent resources", async () => {
    const body = buildLlmsIndex(generatedIndex);

    expect(body).toContain("https://cli.lpm.dev/openapi.json");
    expect(body).toContain("https://cli.lpm.dev/.well-known/api-catalog");
    expect(body).toContain("https://cli.lpm.dev/docs/developer-resources");
    expect(body).toContain(
      "https://cli.lpm.dev/.well-known/agent-skills/index.json",
    );
  });
});
