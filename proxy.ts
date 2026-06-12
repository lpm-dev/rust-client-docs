import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { type NextRequest, NextResponse } from "next/server";
import { agentLinkHeader } from "@/lib/agent-links";
import { docsContentRoute, docsRoute } from "@/lib/shared";

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
    const result = rewriteDocs(pathname);

    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl));
    }
  }

  const linkHeader = agentLinkHeader(pathname);
  if (linkHeader) {
    const response = NextResponse.next();
    response.headers.set("Link", linkHeader);
    return response;
  }

  return NextResponse.next();
}
