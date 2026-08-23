import { markdownResponse } from "@/lib/markdown-response";
import { markdownNotFoundResponse } from "@/lib/not-found-response";
import { getLLMText, getPageMarkdownUrl, source } from "@/lib/source";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/llms.mdx/docs/[[...slug]]">,
) {
  const { slug } = await params;
  const pageSlug = slug?.slice(0, -1);
  const page = source.getPage(pageSlug);
  if (!page) {
    const requestedPath = `/docs${pageSlug?.length ? `/${pageSlug.join("/")}` : ""}`;
    return markdownNotFoundResponse(requestedPath);
  }

  return markdownResponse(await getLLMText(page));
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageMarkdownUrl(page).segments,
  }));
}
