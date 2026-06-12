import { agentSkillsIndex } from "@/lib/agent-skills";

export const revalidate = false;

// The bare directory URL serves the same index as index.json — agents probe
// both forms.
export function GET() {
  return Response.json(agentSkillsIndex(), {
    headers: {
      "X-Robots-Tag": "noindex",
    },
  });
}
