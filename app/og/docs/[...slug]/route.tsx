import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { renderOgTemplate } from "@/lib/og";
import { getPageImage, source } from "@/lib/source";

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/og/docs/[...slug]">,
) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  const { element, options } = await renderOgTemplate({
    title: page.data.title,
    description: page.data.description,
    type: "docs",
  });

  return new ImageResponse(element, options);
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
