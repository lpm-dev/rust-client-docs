import {
  agentSkillsRoute,
  apiCatalogRoute,
  developerResourcesRoute,
  docsSearchApiRoute,
  homeContentRoute,
  llmsFullRoute,
  llmsIndexRoute,
  openApiRoute,
  siteUrl,
} from "@/lib/shared";

export const revalidate = false;

const absolute = (path: string) => `${siteUrl}${path}`;
const apiEndpoint = absolute(docsSearchApiRoute);
const catalogUrl = absolute(apiCatalogRoute);
const openApiUrl = absolute(openApiRoute);
const developerResourcesUrl = absolute(developerResourcesRoute);

// RFC 9727 API catalog represented as an RFC 9264 JSON linkset.
const catalog = {
  linkset: [
    {
      anchor: catalogUrl,
      item: [
        {
          href: apiEndpoint,
          type: "application/json",
          title: "LPM CLI documentation search API",
        },
      ],
    },
    {
      anchor: apiEndpoint,
      "service-desc": [
        {
          href: openApiUrl,
          type: "application/json",
          title: "LPM CLI Documentation API OpenAPI specification",
        },
      ],
      "service-doc": [
        {
          href: developerResourcesUrl,
          type: "text/html",
          title: "LPM CLI developer resources",
        },
      ],
    },
    {
      anchor: `${siteUrl}/`,
      describedby: [
        {
          href: absolute(llmsIndexRoute),
          type: "text/markdown",
          title: "LPM CLI documentation index for agents",
        },
        {
          href: absolute(llmsFullRoute),
          type: "text/markdown",
          title: "Complete LPM CLI documentation corpus",
        },
        {
          href: absolute(homeContentRoute),
          type: "text/markdown",
          title: "LPM CLI homepage as markdown",
        },
        {
          href: `${absolute(agentSkillsRoute)}/index.json`,
          type: "application/json",
          title: "LPM CLI Agent Skills index",
        },
      ],
    },
  ],
};

const linkHeader = [
  `<${apiEndpoint}>; rel="item"; type="application/json"`,
  `<${openApiUrl}>; rel="service-desc"; type="application/json"`,
  `<${developerResourcesUrl}>; rel="service-doc"; type="text/html"`,
].join(", ");

const responseHeaders = {
  "Content-Type":
    'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
  Link: linkHeader,
};

export function GET() {
  return new Response(JSON.stringify(catalog, null, 2), {
    headers: responseHeaders,
  });
}

export function HEAD() {
  return new Response(null, { headers: responseHeaders });
}
