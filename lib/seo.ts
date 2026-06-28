import { contentDatesFor } from "@/lib/content-dates";
import {
  appName,
  homeSeoDescription,
  registryUrl,
  siteUrl,
} from "@/lib/shared";
import { source } from "@/lib/source";

const SEO_TITLE_MIN_LENGTH = 25;
const SEO_TITLE_MAX_LENGTH = 65;
const SEO_DESCRIPTION_MIN_LENGTH = 120;
const SEO_DESCRIPTION_MAX_LENGTH = 170;
const SEO_TITLE_SUFFIX = " | LPM CLI";

type DocsPage = (typeof source)["$inferPage"];

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

function isCommandPage(title: string): boolean {
  return /^(?:lpm|lpx)(?:\s|$)/.test(title);
}

function pickSeoTitle(candidates: string[]): string {
  const inRange = candidates.find(
    (candidate) =>
      candidate.length >= SEO_TITLE_MIN_LENGTH &&
      candidate.length <= SEO_TITLE_MAX_LENGTH,
  );

  if (inRange) return inRange;

  return candidates
    .map((candidate) => ({
      candidate,
      distance: Math.abs(
        candidate.length - (SEO_TITLE_MIN_LENGTH + SEO_TITLE_MAX_LENGTH) / 2,
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0].candidate;
}

export function docsSeoTitle(page: DocsPage): string {
  const title = page.data.title;
  const key = page.slugs.join("/");
  const section = page.slugs[0];
  const titleOverrides: Record<string, string> = {
    "": `LPM CLI docs: package manager and dev toolkit`,
    commands: `LPM command cheat sheet${SEO_TITLE_SUFFIX}`,
    comparison: `LPM vs npm, pnpm, and bun | package manager defaults`,
    "first-install": `First LPM install walkthrough${SEO_TITLE_SUFFIX}`,
    installation: `Install LPM CLI | npm, Homebrew, curl, cargo`,
    "lpm-dev-and-pro": `lpm.dev and Pro features${SEO_TITLE_SUFFIX}`,
    migrating: `Migrate npm, pnpm, yarn, or bun to LPM CLI`,
    "project-setup": `Project setup with package.json and lpm.json${SEO_TITLE_SUFFIX}`,
    registries: `Registry routing with npm and lpm.dev${SEO_TITLE_SUFFIX}`,
    dev: `Developer workflow docs${SEO_TITLE_SUFFIX}`,
    guides: `LPM workflow guides${SEO_TITLE_SUFFIX}`,
    infra: `Infrastructure command docs${SEO_TITLE_SUFFIX}`,
    packages: `Package management docs${SEO_TITLE_SUFFIX}`,
    reference: `LPM config and file reference${SEO_TITLE_SUFFIX}`,
  };
  const candidates = [
    ...(titleOverrides[key] ? [titleOverrides[key]] : []),
    ...(isCommandPage(title)
      ? [`${title} command reference${SEO_TITLE_SUFFIX}`]
      : []),
    ...(section === "reference"
      ? [`${title} reference${SEO_TITLE_SUFFIX}`]
      : []),
    ...(section === "guides" ? [`${title} guide${SEO_TITLE_SUFFIX}`] : []),
    ...(section === "packages" ? [`${title} | LPM package docs`] : []),
    ...(section === "dev" ? [`${title} | LPM dev docs`] : []),
    ...(section === "infra" ? [`${title} | LPM infrastructure docs`] : []),
    `${title}${SEO_TITLE_SUFFIX}`,
  ];

  return pickSeoTitle(candidates);
}

function normalizeSeoText(value: string): string {
  return value
    .replace(/`|\*|_|{|}|\[|\]|\(|\)|#/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const COMMON_SEO_CONTEXTS = [
  "Includes examples, defaults, related commands, and links across the LPM CLI docs.",
  "Use it with installs, registries, workspaces, CI, and secure script workflows.",
  "Covers LPM CLI usage, configuration, and related package manager workflows.",
];

function docsSeoContexts(slugs: string[], title: string): string[] {
  if (slugs.length === 0) {
    return [
      "Start here for installation, registry routing, project setup, commands, guides, and reference material for the LPM CLI.",
      "Covers installation, registries, project setup, commands, guides, and reference material for the LPM CLI.",
      "Use it to find command references, config formats, registry behavior, and common LPM workflows.",
    ];
  }

  if (isCommandPage(title)) {
    return [
      "Includes syntax, examples, flags, workspace behavior, JSON output, and links to related LPM commands.",
      "Use this command reference for flags, examples, registry behavior, workspaces, CI, and secure script defaults.",
      "Covers command syntax, common examples, automation output, registry behavior, and related LPM docs.",
    ];
  }

  switch (slugs[0]) {
    case "packages":
      return [
        "Explains package-manager behavior for npm-compatible registries, lpm.dev packages, workspaces, lockfiles, and secure installs.",
        "Use it with package installs, registry routing, workspaces, lockfiles, lifecycle scripts, and CI workflows.",
        "Covers package workflow details, defaults, examples, and related LPM package commands.",
      ];
    case "dev":
      return [
        "Explains scripts, managed runtimes, task execution, local services, and CI behavior in the LPM CLI.",
        "Use it with package scripts, managed Node or Bun runtimes, task orchestration, dev servers, and CI workflows.",
        "Covers local development defaults, examples, command behavior, and related LPM dev tools.",
      ];
    case "infra":
      return [
        "Explains local HTTPS, tunnels, ports, auth, policy, health checks, and other infrastructure commands in the LPM CLI.",
        "Use it with local infrastructure, registry auth, security policy, project health checks, and CI workflows.",
        "Covers infrastructure defaults, examples, command behavior, and related LPM reference pages.",
      ];
    case "guides":
      return [
        "Follow the workflow with copyable commands, config examples, safety notes, and links to the related LPM references.",
        "Includes practical steps, config files, command examples, and cross-links for the full LPM workflow.",
        "Use it to complete the workflow and jump to the exact command and config reference pages.",
      ];
    case "reference":
      return [
        "Use this reference for exact config fields, authentication behavior, file formats, environment variables, and automation output.",
        "Includes field behavior, defaults, examples, and links to the LPM commands that read or write this data.",
        "Covers configuration, auth, file formats, environment variables, and related LPM reference pages.",
      ];
    default:
      return [
        "Use it to understand LPM package management, developer tooling, registry routing, secure installs, and CI workflows.",
        "Covers LPM defaults, examples, workflows, configuration, and related command reference pages.",
        "Explains how LPM fits package installs, dev tooling, registries, security checks, and CI.",
      ];
  }
}

function fitSeoDescription(base: string, contexts: string[]): string {
  const normalizedBase = normalizeSeoText(base);
  const candidates = [...contexts, ...COMMON_SEO_CONTEXTS].map((context) =>
    normalizeSeoText(`${normalizedBase} ${context}`),
  );
  const inRange = candidates.find(
    (candidate) =>
      candidate.length >= SEO_DESCRIPTION_MIN_LENGTH &&
      candidate.length <= SEO_DESCRIPTION_MAX_LENGTH,
  );

  if (inRange) {
    return inRange;
  }

  let fallback = normalizeSeoText(
    `${normalizedBase} Includes practical examples, defaults, related commands, and links across the LPM CLI docs.`,
  );

  const shortestTooLong = candidates
    .filter((candidate) => candidate.length > SEO_DESCRIPTION_MAX_LENGTH)
    .sort((a, b) => a.length - b.length)[0];

  if (shortestTooLong) {
    fallback = shortestTooLong;
  }

  if (fallback.length <= SEO_DESCRIPTION_MAX_LENGTH) {
    return fallback;
  }

  const clipped = fallback.slice(0, SEO_DESCRIPTION_MAX_LENGTH + 1);
  const boundary = clipped.lastIndexOf(" ", SEO_DESCRIPTION_MAX_LENGTH);

  if (boundary >= SEO_DESCRIPTION_MIN_LENGTH) {
    const candidate = fallback
      .slice(0, boundary)
      .trimEnd()
      .replace(/[\s,;:.-]+$/, "");

    if (candidate.length >= SEO_DESCRIPTION_MIN_LENGTH) {
      return candidate;
    }
  }

  return fallback.slice(0, SEO_DESCRIPTION_MAX_LENGTH).trimEnd();
}

export function docsSeoDescription(page: DocsPage): string {
  return fitSeoDescription(
    page.data.description ?? page.data.title,
    docsSeoContexts(page.slugs, page.data.title),
  );
}

export function docsCanonicalUrl(slugs: string[]): string {
  const path = slugs.length > 0 ? `/docs/${slugs.join("/")}` : "/docs";
  return `${siteUrl}${path}`;
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

export function docsPageJsonLd(page: DocsPage): object {
  const canonicalUrl = docsCanonicalUrl(page.slugs);
  const { published, modified } = contentDatesFor(page.path);

  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${canonicalUrl}#article`,
    headline: docsSeoTitle(page),
    description: docsSeoDescription(page),
    url: canonicalUrl,
    ...(published && { datePublished: published }),
    ...(modified && { dateModified: modified }),
    image: `${siteUrl}/og/docs/${[...page.slugs, "image.png"].join("/")}`,
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: appName,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: appName,
      url: registryUrl,
      logo: `${siteUrl}/lpm-og-logo.svg`,
    },
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
        url: siteUrl,
        name: appName,
        description: homeSeoDescription,
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
        description: homeSeoDescription,
        url: siteUrl,
        downloadUrl: "https://github.com/lpm-dev/rust-client/releases/latest",
        // Resolved at build time in next.config.mjs; omitted when unknown
        // rather than claiming a fake version.
        ...(process.env.LPM_CLI_VERSION && {
          softwareVersion: process.env.LPM_CLI_VERSION,
        }),
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
