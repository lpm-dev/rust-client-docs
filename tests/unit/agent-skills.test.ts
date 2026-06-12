import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  agentSkills,
  agentSkillsIndex,
  getAgentSkill,
} from "../../lib/agent-skills";
import { siteUrl } from "../../lib/shared";

describe("agent skills index", () => {
  it("lists every skill with a spec-shaped entry", () => {
    const index = agentSkillsIndex();

    expect(index.$schema).toContain("agentskills.io/discovery");
    expect(index.skills.length).toBe(agentSkills.length);
    expect(index.skills.length).toBeGreaterThan(0);

    for (const entry of index.skills) {
      expect(entry.type).toBe("skill-md");
      expect(entry.description.length).toBeGreaterThan(20);
      expect(entry.url).toBe(
        `/.well-known/agent-skills/${entry.name}/SKILL.md`,
      );
      expect(entry.digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    }
  });

  it("includes the using-lpm-cli skill", () => {
    const skill = getAgentSkill("using-lpm-cli");

    expect(skill).toBeDefined();
    expect(skill?.content).toContain("# Using the lpm CLI");
    expect(skill?.content).toContain("lpm install");
  });
});

describe("skill content stays in sync with the docs", () => {
  const docsDir = path.join(process.cwd(), "content", "docs");

  it("every linked docs page exists", () => {
    for (const skill of agentSkills) {
      const links = skill.content.matchAll(
        new RegExp(`${siteUrl}/docs/([\\w\\-/]*)\\.mdx`, "g"),
      );

      for (const [link, slug] of links) {
        const exists =
          existsSync(path.join(docsDir, `${slug}.mdx`)) ||
          existsSync(path.join(docsDir, slug, "index.mdx"));
        expect(exists, `${skill.name} links missing docs page: ${link}`).toBe(
          true,
        );
      }
    }
  });

  it("only links markdown-capable URLs for docs pages", () => {
    for (const skill of agentSkills) {
      const htmlDocsLinks = skill.content.match(
        new RegExp(`${siteUrl}/docs/[\\w\\-/]+(?=\\))(?<!\\.mdx)`, "g"),
      );
      expect(
        htmlDocsLinks,
        `${skill.name} links docs pages without .mdx: ${htmlDocsLinks}`,
      ).toBeNull();
    }
  });
});
