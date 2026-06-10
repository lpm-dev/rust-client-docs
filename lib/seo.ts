import { contentDatesFor } from "@/lib/content-dates";
import {
  appName,
  homeSeoDescription,
  registryUrl,
  siteUrl,
} from "@/lib/shared";
import { source } from "@/lib/source";

const SEO_TITLE_MIN_LENGTH = 50;
const SEO_TITLE_MAX_LENGTH = 60;
const SEO_DESCRIPTION_MIN_LENGTH = 150;
const SEO_DESCRIPTION_MAX_LENGTH = 160;

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
  return /^lpm\b/.test(title);
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
  const candidates = [
    ...(isCommandPage(title)
      ? [`${title} command reference | LPM package manager docs`]
      : []),
    `${title} documentation and guides | LPM package manager`,
    `${title} reference | LPM package manager docs`,
    `${title} guide | LPM package manager docs`,
    `${title} | LPM package manager docs`,
    `${title} | LPM CLI docs`,
    `${title} | lpm docs`,
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
  "Use it with lpm package installs, scripts, registries, security checks, workspaces, and CI workflows.",
  "Use it with lpm installs, scripts, registries, security checks, workspaces, and CI workflows.",
  "Use it with lpm installs, scripts, registries, security checks, configs, and CI workflows.",
  "Use it with lpm installs, scripts, registries, config, security checks, and CI workflows.",
  "Use it with lpm installs, scripts, registries, security checks, and CI workflows.",
  "Use it with lpm installs, registries, security checks, and CI workflows.",
  "Use it with lpm installs, registries, and CI workflows.",
  "Covers lpm installs, registries, workspaces, and CI workflows.",
  "Covers lpm installs, registries, and CI workflows.",
  "Covers lpm workflows and related reference pages.",
  "Covers package workflow details.",
  "Covers related lpm workflows.",
  "Covers related lpm docs.",
  "Covers lpm CLI usage.",
  "Covers lpm workflows.",
  "Covers lpm tradeoffs.",
  "Covers lpm details.",
  "Covers lpm usage.",
];

function docsSeoContexts(slugs: string[], title: string): string[] {
  if (slugs.length === 0) {
    return [
      "Start here for installation, registry routing, project setup, commands, guides, and reference material for the lpm CLI.",
      "Covers installation, registry routing, project setup, commands, guides, and lpm CLI reference material.",
      "Covers installation, registries, setup, commands, guides, and lpm CLI reference material.",
      "Covers setup, registries, commands, and lpm CLI references.",
    ];
  }

  if (isCommandPage(title)) {
    return [
      "Use this command reference for flags, examples, registry behavior, workspaces, CI, and the default security model in the lpm CLI.",
      "Use this command reference for flags, examples, registry behavior, workspaces, CI usage, automation, and lpm security defaults.",
      "Use this command reference for flags, examples, registry behavior, workspaces, CI, automation, and lpm security defaults.",
      "Use this command reference for flags, examples, registry behavior, workspaces, CI, and secure lpm script defaults.",
      "Covers flags, examples, registry behavior, workspaces, CI usage, script security defaults, and related lpm docs.",
      "Covers flags, examples, registry behavior, workspaces, CI automation, security defaults, and related lpm docs.",
      "Covers flags, examples, registry behavior, workspaces, CI usage, security defaults, and related lpm docs.",
      "Covers flags, examples, registries, workspaces, CI, security defaults, and lpm reference docs.",
      "Covers flags, examples, registries, workspaces, CI, security defaults, and related lpm docs.",
      "Covers flags, examples, registries, workspaces, CI, and security defaults.",
      "Covers flags, examples, registries, workspaces, and security.",
      "Covers flags, examples, workspaces, CI, and security defaults.",
      "Covers flags, examples, registries, and security defaults.",
      "Covers flags, examples, registries, workspaces, and CI.",
      "Covers flags, examples, registries, and workspaces.",
      "Covers flags, examples, and registries.",
      "Covers flags and examples.",
    ];
  }

  switch (slugs[0]) {
    case "packages":
      return [
        "Use it with npm-compatible registries, lpm.dev packages, workspaces, lockfiles, and the secure install pipeline.",
        "Covers npm-compatible registries, lpm.dev packages, workspaces, lockfiles, and the secure install pipeline.",
        "Covers registries, lpm.dev packages, workspaces, lockfiles, and secure installs.",
        "Covers registries, workspaces, lockfiles, and secure installs.",
        "Covers registries, workspaces, and secure installs.",
        "Covers lpm package workflows.",
      ];
    case "dev":
      return [
        "Covers local development workflows, scripts, managed runtimes, task execution, CI usage, and how the lpm CLI wires projects together.",
        "Covers scripts, managed runtimes, task execution, CI usage, and how the lpm CLI wires projects together.",
        "Covers scripts, managed runtimes, task execution, CI usage, and lpm project wiring.",
        "Covers scripts, managed runtimes, task execution, and CI usage.",
        "Covers scripts, runtimes, tasks, and CI usage.",
        "Covers lpm dev workflows.",
      ];
    case "infra":
      return [
        "Covers local HTTPS, tunnels, ports, dependency graphs, health checks, and the infrastructure commands built into the lpm CLI.",
        "Covers local HTTPS, tunnels, ports, dependency graphs, health checks, and built-in lpm infrastructure commands.",
        "Covers HTTPS, tunnels, ports, dependency graphs, health checks, and lpm infrastructure commands.",
        "Covers HTTPS, tunnels, ports, graphs, health checks, and infra commands.",
        "Covers HTTPS, tunnels, ports, graphs, and health checks.",
        "Covers lpm infrastructure workflows.",
      ];
    case "guides":
      return [
        "Follow the workflow with practical commands, config files, safety notes, and links to the related lpm CLI reference pages.",
        "Follow the workflow with commands, config files, safety notes, and links to related lpm CLI reference pages.",
        "Follow practical commands, config files, safety notes, and related lpm reference pages.",
        "Follow practical commands, config files, and related lpm references.",
        "Follow practical lpm workflow steps.",
      ];
    case "reference":
      return [
        "Use this reference for exact config fields, authentication behavior, file formats, environment variables, and automation-friendly output.",
        "Covers config fields, authentication behavior, file formats, environment variables, and automation-friendly output.",
        "Covers config fields, auth behavior, file formats, environment variables, and automation output.",
        "Covers config fields, auth, file formats, env vars, and automation output.",
        "Covers lpm reference details.",
      ];
    default:
      return [
        "Learn how lpm works as a Rust package manager and developer toolkit for npm-compatible projects, private registries, and CI.",
        "Learn how lpm works as a Rust package manager for npm projects, private registries, secure installs, and CI.",
        "Learn how lpm works as a Rust package manager for npm-compatible projects, private registries, and CI.",
        "Covers lpm package management, developer tooling, npm-compatible projects, private registries, and CI.",
        "Covers lpm package management, developer tooling, registries, secure installs, workspaces, and CI.",
        "Covers lpm package management, developer tooling, registries, and CI.",
        "Covers lpm package management and developer tooling.",
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
    `${normalizedBase} Learn how it fits into lpm installs, scripts, registries, security checks, workspaces, and CI workflows.`,
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
