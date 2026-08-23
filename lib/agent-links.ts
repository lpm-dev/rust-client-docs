import {
  apiCatalogRoute,
  developerResourcesRoute,
  docsRoute,
  homeContentRoute,
  llmsIndexRoute,
  openApiRoute,
} from "./shared";

const markdownType = 'type="text/markdown"';

const homeLinkHeader = [
  `<${homeContentRoute}>; rel="alternate"; ${markdownType}`,
  `<${apiCatalogRoute}>; rel="api-catalog"`,
  `<${openApiRoute}>; rel="service-desc"; type="application/json"`,
  `<${developerResourcesRoute}>; rel="service-doc"`,
  `<${llmsIndexRoute}>; rel="describedby"; ${markdownType}`,
].join(", ");

/**
 * Builds the RFC 8288 `Link` response header advertising agent-readable
 * resources for a path: the homepage points at the API catalog, docs, and
 * llms.txt; each docs page points at its markdown mirror (`{path}.mdx`).
 * Returns undefined for paths with nothing to advertise.
 */
export function agentLinkHeader(pathname: string): string | undefined {
  if (pathname === "/") return homeLinkHeader;

  const path =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  if (path !== docsRoute && !path.startsWith(`${docsRoute}/`)) return undefined;
  if (path.endsWith(".mdx")) return undefined;

  return [
    `<${path}.mdx>; rel="alternate"; ${markdownType}`,
    `<${apiCatalogRoute}>; rel="api-catalog"`,
    `<${openApiRoute}>; rel="service-desc"; type="application/json"`,
  ].join(", ");
}
