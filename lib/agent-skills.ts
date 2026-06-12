import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { agentSkillsRoute } from "./shared";

export type AgentSkill = {
  name: string;
  description: string;
  content: string;
  digest: string;
};

const SKILLS_DIR = path.join(process.cwd(), "skills");

function frontmatterField(content: string, field: string): string {
  const block = content.match(/^---\n([\s\S]*?)\n---/);
  if (!block) return "";
  const line = block[1]
    .split("\n")
    .find((entry) => entry.startsWith(`${field}:`));
  return line ? line.slice(field.length + 1).trim() : "";
}

function loadSkill(name: string): AgentSkill {
  const content = readFileSync(path.join(SKILLS_DIR, name, "SKILL.md"), "utf8");
  const declaredName = frontmatterField(content, "name");
  const description = frontmatterField(content, "description");
  if (declaredName !== name) {
    throw new Error(
      `skills/${name}/SKILL.md declares name "${declaredName}" — must match its folder`,
    );
  }
  if (!description) {
    throw new Error(`skills/${name}/SKILL.md is missing a description`);
  }

  return {
    name,
    description,
    content,
    digest: `sha256:${createHash("sha256").update(content).digest("hex")}`,
  };
}

// Read once at module scope: the routes are statically rendered, so this
// runs at build time and the digests are baked into the prerendered output.
export const agentSkills: AgentSkill[] = readdirSync(SKILLS_DIR, {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => loadSkill(entry.name))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getAgentSkill(name: string): AgentSkill | undefined {
  return agentSkills.find((skill) => skill.name === name);
}

/** Discovery index per the agentskills.io spec, served at the well-known URL. */
export function agentSkillsIndex() {
  return {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: agentSkills.map(({ name, description, digest }) => ({
      name,
      type: "skill-md",
      description,
      url: `${agentSkillsRoute}/${name}/SKILL.md`,
      digest,
    })),
  };
}
