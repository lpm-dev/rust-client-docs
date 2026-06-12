import { notFound } from "next/navigation";
import { agentSkills, getAgentSkill } from "@/lib/agent-skills";
import { markdownResponse } from "@/lib/markdown-response";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/.well-known/agent-skills/[skill]/SKILL.md">,
) {
  const { skill } = await params;
  const found = getAgentSkill(skill);
  if (!found) notFound();

  return markdownResponse(found.content);
}

export function generateStaticParams() {
  return agentSkills.map((skill) => ({ skill: skill.name }));
}
