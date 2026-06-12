import { agentSkillsIndex } from "@/lib/agent-skills";

export const revalidate = false;

export function GET() {
  return Response.json(agentSkillsIndex(), {
    headers: {
      "X-Robots-Tag": "noindex",
    },
  });
}
