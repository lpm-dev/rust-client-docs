import {
  agentSkillsRoute,
  apiCatalogRoute,
  developerResourcesRoute,
  llmsFullRoute,
  openApiRoute,
  siteUrl,
} from "./shared";

export function buildLlmsIndex(generatedDocsIndex: string): string {
  const docsIndex = generatedDocsIndex.replace(
    /^# Get Started\n/,
    "## LPM CLI documentation\n",
  );
  const resources = `# LPM CLI developer resources

> LPM CLI is a package manager and developer toolkit. Use these files to discover its public documentation and the cli.lpm.dev search API.

## Machine-readable resources

- [LPM CLI OpenAPI specification](${siteUrl}${openApiRoute}): OpenAPI 3.1 description of the public documentation search API.
- [LPM CLI API catalog](${siteUrl}${apiCatalogRoute}): RFC 9727 catalog of public APIs and their descriptions.
- [LPM CLI developer resources](${siteUrl}${developerResourcesRoute}): Human-readable API, authentication, MCP, skill, and webhook links.
- [LPM CLI Agent Skills index](${siteUrl}${agentSkillsRoute}/index.json): Installable instructions for agents that use LPM CLI.
- [Complete LPM CLI documentation](${siteUrl}${llmsFullRoute}): All documentation pages in one markdown response.

`;

  return `${resources}${docsIndex}`;
}
