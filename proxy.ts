import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { type NextRequest, NextResponse } from "next/server";
import { agentLinkHeader } from "@/lib/agent-links";
import { docsContentRoute, docsRoute, homeContentRoute } from "@/lib/shared";

const { rewrite: rewriteDocs } = rewritePath(
  `${docsRoute}{/*path}`,
  `${docsContentRoute}{/*path}/content.md`,
);
const { rewrite: rewriteSuffix } = rewritePath(
  `${docsRoute}{/*path}.mdx`,
  `${docsContentRoute}{/*path}/content.md`,
);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
      response.headers.append("Vary", "Accept");
      return response;
    }
  }

  // agentLinkHeader returns a value exactly for the negotiable HTML paths
  // (/ and /docs/*), which therefore also need Vary: Accept.
  const linkHeader = agentLinkHeader(pathname);
  if (linkHeader) {
    const response = NextResponse.next();
    response.headers.set("Link", linkHeader);
    response.headers.append("Vary", "Accept");
    return response;
  }

  return NextResponse.next();
}
