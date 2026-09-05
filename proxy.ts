import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { type NextRequest, NextResponse } from "next/server";
import { agentLinkHeader } from "@/lib/agent-links";
import { apiProblem } from "@/lib/api-problem";
import { canNegotiateMissingHtml } from "@/lib/content-negotiation.mjs";
import { docsContentRoute, docsRoute, homeContentRoute } from "@/lib/shared";
import { appendVary } from "@/lib/vary.mjs";

const { rewrite: rewriteDocs } = rewritePath(
  `${docsRoute}{/*path}`,
  `${docsContentRoute}{/*path}/content.md`,
);
const { rewrite: rewriteSuffix } = rewritePath(
  `${docsRoute}{/*path}.mdx`,
  `${docsContentRoute}{/*path}/content.md`,
);

const MARKDOWN_404_ROUTE = "/404.md";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/schemas/") &&
    request.method !== "GET" &&
    request.method !== "HEAD"
  ) {
    return apiProblem(request, {
      status: 405,
      code: "METHOD_NOT_ALLOWED",
      title: "Method not allowed",
      message: `${request.method} is not supported for this schema resource.`,
      resolution: "Use GET or HEAD to retrieve the schema.",
      headers: {
        Allow: "GET, HEAD",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  }

  const suffixResult = rewriteSuffix(pathname);
  if (suffixResult) {
    const response = NextResponse.rewrite(
      new URL(suffixResult, request.nextUrl),
    );
    response.headers.set(
      "Link",
      `<${pathname.slice(0, -".mdx".length)}>; rel="alternate"; type="text/html"`,
    );
    return response;
  }

  if (isMarkdownPreferred(request)) {
    const target = pathname === "/" ? homeContentRoute : rewriteDocs(pathname);

    if (target) {
      const response = NextResponse.rewrite(new URL(target, request.nextUrl));
      appendVary(response.headers, "Accept");
      return response;
    }

    if (canNegotiateMissingHtml(pathname)) {
      const targetUrl = new URL(MARKDOWN_404_ROUTE, request.nextUrl);
      targetUrl.searchParams.set("path", pathname);
      const response = NextResponse.rewrite(targetUrl);
      appendVary(response.headers, "Accept");
      return response;
    }
  }

  // agentLinkHeader returns a value exactly for the negotiable HTML paths
  // (/ and /docs/*), which therefore also need Vary: Accept.
  const linkHeader = agentLinkHeader(pathname);
  if (linkHeader) {
    const response = NextResponse.next();
    response.headers.set("Link", linkHeader);
    appendVary(response.headers, "Accept");
    return response;
  }

  return NextResponse.next();
}
