import { appName, appTagline, registryUrl, siteUrl } from "@/lib/shared";
import { source } from "@/lib/source";

/**
 * Wrap a JSON-LD object for `dangerouslySetInnerHTML`. Escapes `<` so a
 * description like `<script>` in a page frontmatter can't break out of the
 * `<script type="application/ld+json">` element.
 */
export function safeJsonLd(data: unknown): { __html: string } {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}

function titleCase(segment: string): string {
  return segment
    .split("-")
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(" ");
}

/**
 * Build a BreadcrumbList JSON-LD object for a docs page.
 *
 * Walks the slug from `/docs` down to the leaf, asking the fumadocs source
 * for each intermediate page's canonical title. Falls back to title-cased
 * segments when an index page is missing.
 */
export function docsBreadcrumbJsonLd(slug: string[]): object {
  const items: {
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }[] = [];

  // The breadcrumb root is the docs section itself, not the index page's
  // frontmatter title (which may be a marketing-style headline like "LPM").
  items.push({
    "@type": "ListItem",
    position: 1,
    name: "Docs",
    item: `${siteUrl}/docs`,
  });

  for (let i = 0; i < slug.length; i++) {
    const prefix = slug.slice(0, i + 1);
    const isLast = i === slug.length - 1;
    const page = source.getPage(prefix);
    const name = page?.data.title ?? titleCase(prefix[i]);
    const url = `${siteUrl}/docs/${prefix.join("/")}`;

    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      name,
      ...(isLast ? {} : { item: url }),
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

/**
 * Home-page schema bundle: `WebSite` (with sitelinks search hint pointing at
 * the docs in-page search), `Organization`, and a `SoftwareApplication`
 * record for the lpm CLI so it can pick up a knowledge-panel signal.
 */
export function homeJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: appName,
        description: appTagline,
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/docs?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: appName,
        url: registryUrl,
        logo: `${siteUrl}/lpm-og-logo.svg`,
        sameAs: ["https://github.com/lpm-dev", "https://x.com/LPM_dev_"],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#cli`,
        name: "lpm",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "macOS, Linux, Windows",
        description: appTagline,
        url: siteUrl,
        downloadUrl: "https://github.com/lpm-dev/rust-client/releases/latest",
        softwareVersion: "latest",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };
}
