import {
  FEATURES,
  type Feature,
  FOOTER,
  GUARDRAILS,
  HERO_SUB,
  INSTALL_CMD,
  MORE,
} from "@/lib/home-content";
import { markdownResponse } from "@/lib/markdown-response";
import {
  appName,
  appTagline,
  llmsFullRoute,
  llmsIndexRoute,
  siteUrl,
} from "@/lib/shared";

export const revalidate = false;

function absolute(href: string) {
  return href.startsWith("http") ? href : `${siteUrl}${href}`;
}

function featureList(items: Feature[]) {
  return items
    .map(
      (feature) =>
        `### ${feature.title}\n\n${feature.body}\n\n\`${feature.cmd}\` — [docs](${absolute(feature.href)})`,
    )
    .join("\n\n");
}

const footerLinks = FOOTER.map(
  (column) =>
    `**${column.heading}**\n\n${column.links
      .map((link) => `- [${link.label}](${absolute(link.href)})`)
      .join("\n")}`,
).join("\n\n");

// Markdown twin of the homepage, generated from the same data the JSX
// renders (lib/home-content.ts). Served at / via Accept: text/markdown
// content negotiation in proxy.ts.
const markdown = `# ${appName} (${siteUrl})

> ${appTagline}

${HERO_SUB}

## Install

\`\`\`bash
${INSTALL_CMD}
\`\`\`

## Features

${featureList(FEATURES)}

## Beyond install

${featureList(MORE)}

## Even more

${featureList(GUARDRAILS)}

## Links

${footerLinks}

---

Full documentation for agents: [llms.txt](${siteUrl}${llmsIndexRoute}) (index) · [llms-full.txt](${siteUrl}${llmsFullRoute}) (entire corpus) · append \`.mdx\` to any docs URL for that page as markdown.
`;

export function GET() {
  return markdownResponse(markdown);
}
