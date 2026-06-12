import {
  apiCatalogRoute,
  docsRoute,
  homeContentRoute,
  llmsFullRoute,
  llmsIndexRoute,
  siteUrl,
} from "@/lib/shared";

export const revalidate = false;

// RFC 9727 API catalog: an RFC 9264 linkset enumerating the machine-readable
// surfaces of this site. Advertised via `Link: <...>; rel="api-catalog"`
// response headers (see lib/agent-links.ts).
const catalog = {
  linkset: [
    {
      anchor: `${siteUrl}${apiCatalogRoute}`,
      item: [
        {
          href: `${siteUrl}${llmsIndexRoute}`,
          type: "text/markdown",
          title: "llms.txt — index of the documentation for agents",
        },
        {
          href: `${siteUrl}${llmsFullRoute}`,
          type: "text/markdown",
          title: "Full documentation corpus as a single markdown file",
        },
        {
          href: `${siteUrl}${docsRoute}.mdx`,
          type: "text/markdown",
          title: "Markdown mirror — append .mdx to any /docs page URL",
        },
        {
          href: `${siteUrl}${homeContentRoute}`,
          type: "text/markdown",
          title: "Homepage as markdown",
        },
      ],
    },
    {
      anchor: `${siteUrl}/`,
      "service-doc": [
        {
          href: `${siteUrl}${docsRoute}`,
          type: "text/html",
          title: "LPM CLI documentation",
        },
      ],
      describedby: [
        {
          href: `${siteUrl}${llmsIndexRoute}`,
          type: "text/markdown",
          title: "llms.txt",
        },
      ],
    },
  ],
};

export function GET() {
  return new Response(JSON.stringify(catalog, null, 2), {
    headers: {
      "Content-Type":
        'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      "X-Robots-Tag": "noindex",
    },
  });
}
