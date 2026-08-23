import { markdownResponse } from "./markdown-response";
import {
  developerResourcesRoute,
  llmsIndexRoute,
  openApiRoute,
  siteUrl,
} from "./shared";

export function notFoundMarkdown(pathname: string): string {
  return `# 404: LPM CLI resource not found

No page exists at \`${pathname}\`.

- [LPM CLI documentation](${siteUrl}/docs)
- [LPM CLI sitemap](${siteUrl}/sitemap.xml)
- [LPM CLI agent index](${siteUrl}${llmsIndexRoute})
- [LPM CLI developer resources](${siteUrl}${developerResourcesRoute})
- [LPM CLI OpenAPI specification](${siteUrl}${openApiRoute})
`;
}

export function markdownNotFoundResponse(pathname: string): Response {
  return markdownResponse(notFoundMarkdown(pathname), {
    status: 404,
    headers: {
      "Cache-Control": "no-store",
      Link: `<${llmsIndexRoute}>; rel="describedby"; type="text/markdown", </sitemap.xml>; rel="sitemap"`,
      Vary: "Accept",
    },
  });
}
