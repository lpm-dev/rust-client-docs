import { notFound } from "next/navigation";
import { getLLMText, getPageMarkdownUrl, source } from "@/lib/source";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/llms.mdx/docs/[[...slug]]">,
) {
  const { slug } = await params;
  const page = source.getPage(slug?.slice(0, -1));
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // Keep the markdown mirror out of search indexes so it never competes
      // with the canonical HTML page; crawlers and LLM agents can still fetch it.
      "X-Robots-Tag": "noindex",
    },
  });
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageMarkdownUrl(page).segments,
  }));
}
