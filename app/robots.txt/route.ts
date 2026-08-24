import { siteUrl } from "@/lib/shared";

export const revalidate = false;

// Hand-emitted because Next's MetadataRoute.Robots cannot express the
// Content-Signal directive (contentsignals.org). Mirrors the previous
// generated output; /og/ stays crawlable — JSON-LD image fields point there.
const robots = `# Content signals declare permissions for automated content use:
# search   — building a search index and providing search results
# ai-input — using content as input to an AI system (grounding, RAG, agents)
# ai-train — training or fine-tuning AI models
# An absent signal means no statement is made for that use.

User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /
Allow: /api/v1/search
Allow: /api/search
Disallow: /api/cron/
Disallow: /a/

Host: ${siteUrl}
Sitemap: ${siteUrl}/sitemap.xml
`;

export function GET() {
  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
