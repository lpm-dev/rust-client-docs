import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import {
  docsBreadcrumbJsonLd,
  docsCanonicalUrl,
  docsPageJsonLd,
  docsSeoDescription,
  docsSeoTitle,
  safeJsonLd,
} from "@/lib/seo";
import { docsRepoConfig } from "@/lib/shared";
import { getPageImage, getPageMarkdownUrl, source } from "@/lib/source";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const breadcrumb = docsBreadcrumbJsonLd(params.slug ?? []);
  const article = docsPageJsonLd(page);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is escaped by safeJsonLd
        dangerouslySetInnerHTML={safeJsonLd(breadcrumb)}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is escaped by safeJsonLd
        dangerouslySetInnerHTML={safeJsonLd(article)}
      />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">
        {page.data.description}
      </DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${docsRepoConfig.user}/${docsRepoConfig.repo}/blob/${docsRepoConfig.branch}/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  const title = docsSeoTitle(page);
  const description = docsSeoDescription(page);
  const canonical = docsCanonicalUrl(page.slugs);
  const image = getPageImage(page).url;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical,
      types: {
        "text/markdown": getPageMarkdownUrl(page).url,
      },
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
