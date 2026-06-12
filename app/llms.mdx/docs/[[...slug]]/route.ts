import { notFound } from "next/navigation";
import { markdownResponse } from "@/lib/markdown-response";
import { getLLMText, getPageMarkdownUrl, source } from "@/lib/source";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/llms.mdx/docs/[[...slug]]">,
) {
  const { slug } = await params;
  const page = source.getPage(slug?.slice(0, -1));
  if (!page) notFound();

  return markdownResponse(await getLLMText(page));
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageMarkdownUrl(page).segments,
  }));
}
