#!/usr/bin/env node

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const DOCS_DIR = path.join(ROOT_DIR, "content", "docs");
const DOCS_ROUTE_FILE = path.join(
  ROOT_DIR,
  "app",
  "docs",
  "[[...slug]]",
  "page.tsx",
);
const HOME_ROUTE_FILE = path.join(ROOT_DIR, "app", "(home)", "page.tsx");
const SHARED_FILE = path.join(ROOT_DIR, "lib", "shared.ts");
const SEO_FILE = path.join(ROOT_DIR, "lib", "seo.ts");
const SITEMAP_FILE = path.join(ROOT_DIR, "app", "sitemap.ts");
const ROBOTS_FILE = path.join(ROOT_DIR, "app", "robots.txt", "route.ts");
const NEXT_CONFIG_FILE = path.join(ROOT_DIR, "next.config.mjs");

const TITLE_MIN_LENGTH = 25;
const TITLE_MAX_LENGTH = 65;
const DESCRIPTION_MIN_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 170;
const SEO_TITLE_SUFFIX = " | LPM CLI";

function collectMdxPages(dir) {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectMdxPages(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function parseYamlScalar(value) {
  const trimmed = value.trim();
  const quote = trimmed[0];

  if (
    (quote === `"` || quote === `'`) &&
    trimmed.length >= 2 &&
    trimmed.at(-1) === quote
  ) {
    if (quote === `"`) {
      return JSON.parse(trimmed);
    }

    return trimmed.slice(1, -1).replace(/''/g, "'");
  }

  return trimmed;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const data = {};

  for (const line of match[1].split("\n")) {
    const entry = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!entry) continue;

    data[entry[1]] = parseYamlScalar(entry[2]);
  }

  return data;
}

function slugsForPage(filePath) {
  const relativePath = path.relative(DOCS_DIR, filePath).replace(/\.mdx$/, "");
  const slugs = relativePath.split(path.sep).filter(Boolean);

  if (slugs.at(-1) === "index") {
    slugs.pop();
  }

  return slugs;
}

function docsUrlForSlugs(slugs) {
  return slugs.length > 0 ? `/docs/${slugs.join("/")}` : "/docs";
}

function isCommandPage(title) {
  return /^(?:lpm|lpx)(?:\s|$)/.test(title);
}

function pickSeoTitle(candidates) {
  const inRange = candidates.find(
    (candidate) =>
      candidate.length >= TITLE_MIN_LENGTH &&
      candidate.length <= TITLE_MAX_LENGTH,
  );

  if (inRange) return inRange;

  return candidates
    .map((candidate) => ({
      candidate,
      distance: Math.abs(
        candidate.length - (TITLE_MIN_LENGTH + TITLE_MAX_LENGTH) / 2,
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0].candidate;
}

function docsSeoTitle(title, slugs) {
  const key = slugs.join("/");
  const section = slugs[0];
  const titleOverrides = {
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

function normalizeSeoText(value) {
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

function docsSeoContexts(slugs, title) {
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

function fitSeoDescription(base, contexts) {
  const normalizedBase = normalizeSeoText(base);
  const candidates = [...contexts, ...COMMON_SEO_CONTEXTS].map((context) =>
    normalizeSeoText(`${normalizedBase} ${context}`),
  );
  const inRange = candidates.find(
    (candidate) =>
      candidate.length >= DESCRIPTION_MIN_LENGTH &&
      candidate.length <= DESCRIPTION_MAX_LENGTH,
  );

  if (inRange) {
    return inRange;
  }

  let fallback = normalizeSeoText(
    `${normalizedBase} Includes practical examples, defaults, related commands, and links across the LPM CLI docs.`,
  );

  const shortestTooLong = candidates
    .filter((candidate) => candidate.length > DESCRIPTION_MAX_LENGTH)
    .sort((a, b) => a.length - b.length)[0];

  if (shortestTooLong) {
    fallback = shortestTooLong;
  }

  if (fallback.length <= DESCRIPTION_MAX_LENGTH) {
    return fallback;
  }

  const clipped = fallback.slice(0, DESCRIPTION_MAX_LENGTH + 1);
  const boundary = clipped.lastIndexOf(" ", DESCRIPTION_MAX_LENGTH);

  if (boundary >= DESCRIPTION_MIN_LENGTH) {
    const candidate = fallback
      .slice(0, boundary)
      .trimEnd()
      .replace(/[\s,;:.-]+$/, "");

    if (candidate.length >= DESCRIPTION_MIN_LENGTH) {
      return candidate;
    }
  }

  return fallback.slice(0, DESCRIPTION_MAX_LENGTH).trimEnd();
}

function docsSeoDescription(frontmatter, slugs) {
  return fitSeoDescription(
    frontmatter.description,
    docsSeoContexts(slugs, frontmatter.title),
  );
}

function getLineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

function extractStringConst(content, name) {
  const match = content.match(
    new RegExp(
      `export\\s+const\\s+${name}\\s*=\\s*(["'\`])([\\s\\S]*?)\\1\\s*;`,
    ),
  );

  if (!match) return null;

  return {
    value: match[2],
    line: getLineNumber(content, match.index ?? 0),
  };
}

function validateLength(violations, filePath, line, label, value, min, max) {
  if (value.length >= min && value.length <= max) return;

  violations.push({
    filePath,
    line,
    message: `${label} must be ${min}-${max} characters; found ${value.length}: ${value}`,
  });
}

function addUnique(violations, seen, filePath, label, value) {
  const previous = seen.get(value);
  if (!previous) {
    seen.set(value, filePath);
    return;
  }

  violations.push({
    filePath,
    line: 1,
    message: `${label} duplicates ${previous}: ${value}`,
  });
}

function validateDocsPages() {
  const titleSeen = new Map();
  const descriptionSeen = new Map();
  const violations = [];
  const pages = collectMdxPages(DOCS_DIR);

  for (const pagePath of pages) {
    const content = readFileSync(pagePath, "utf8");
    const frontmatter = parseFrontmatter(content);
    const relativePath = path.relative(ROOT_DIR, pagePath);

    if (!frontmatter) {
      violations.push({
        filePath: relativePath,
        line: 1,
        message: "Missing frontmatter",
      });
      continue;
    }

    for (const key of ["title", "description"]) {
      if (
        typeof frontmatter[key] !== "string" ||
        frontmatter[key].length === 0
      ) {
        violations.push({
          filePath: relativePath,
          line: 1,
          message: `Missing frontmatter ${key}`,
        });
      }
    }

    if (
      typeof frontmatter.title !== "string" ||
      typeof frontmatter.description !== "string"
    ) {
      continue;
    }

    const slugs = slugsForPage(pagePath);
    const title = docsSeoTitle(frontmatter.title, slugs);
    const description = docsSeoDescription(frontmatter, slugs);

    validateLength(
      violations,
      relativePath,
      1,
      `Resolved title for ${docsUrlForSlugs(slugs)}`,
      title,
      TITLE_MIN_LENGTH,
      TITLE_MAX_LENGTH,
    );
    validateLength(
      violations,
      relativePath,
      1,
      `Resolved description for ${docsUrlForSlugs(slugs)}`,
      description,
      DESCRIPTION_MIN_LENGTH,
      DESCRIPTION_MAX_LENGTH,
    );
    addUnique(violations, titleSeen, relativePath, "Resolved title", title);
    addUnique(
      violations,
      descriptionSeen,
      relativePath,
      "Resolved description",
      description,
    );
  }

  return { pages, violations };
}

function validateSharedMetadata() {
  const content = readFileSync(SHARED_FILE, "utf8");
  const violations = [];
  const checks = [
    {
      name: "homeSeoTitle",
      label: "Home SEO title",
      min: TITLE_MIN_LENGTH,
      max: TITLE_MAX_LENGTH,
    },
    {
      name: "homeSeoDescription",
      label: "Home SEO description",
      min: DESCRIPTION_MIN_LENGTH,
      max: DESCRIPTION_MAX_LENGTH,
    },
  ];

  for (const check of checks) {
    const constant = extractStringConst(content, check.name);

    if (!constant) {
      violations.push({
        filePath: path.relative(ROOT_DIR, SHARED_FILE),
        line: 1,
        message: `Missing ${check.name} string constant`,
      });
      continue;
    }

    validateLength(
      violations,
      path.relative(ROOT_DIR, SHARED_FILE),
      constant.line,
      check.label,
      constant.value,
      check.min,
      check.max,
    );
  }

  return violations;
}

function requireSnippet(violations, filePath, content, snippet, message) {
  if (content.includes(snippet)) return;

  violations.push({
    filePath: path.relative(ROOT_DIR, filePath),
    line: 1,
    message,
  });
}

function validateRouteWiring() {
  const violations = [];
  const docsRoute = readFileSync(DOCS_ROUTE_FILE, "utf8");
  const homeRoute = readFileSync(HOME_ROUTE_FILE, "utf8");
  const seo = readFileSync(SEO_FILE, "utf8");
  const sitemap = readFileSync(SITEMAP_FILE, "utf8");
  const robots = readFileSync(ROBOTS_FILE, "utf8");
  const nextConfig = readFileSync(NEXT_CONFIG_FILE, "utf8");

  for (const snippet of [
    "docsSeoTitle",
    "docsSeoDescription",
    "docsCanonicalUrl",
    "docsPageJsonLd",
    "docsBreadcrumbJsonLd",
    'type="application/ld+json"',
    "alternates:",
    "openGraph:",
    "twitter:",
  ]) {
    requireSnippet(
      violations,
      DOCS_ROUTE_FILE,
      docsRoute,
      snippet,
      `Docs route must include ${snippet}`,
    );
  }

  for (const snippet of [
    "export const metadata",
    "homeSeoTitle",
    "homeSeoDescription",
    "homeJsonLd()",
    "alternates:",
    "openGraph:",
    "twitter:",
  ]) {
    requireSnippet(
      violations,
      HOME_ROUTE_FILE,
      homeRoute,
      snippet,
      `Home route must include ${snippet}`,
    );
  }

  for (const snippet of [
    '"@type": "TechArticle"',
    '"@type": "BreadcrumbList"',
    '"@type": "WebSite"',
    '"@type": "SoftwareApplication"',
    "datePublished",
    "dateModified",
  ]) {
    requireSnippet(
      violations,
      SEO_FILE,
      seo,
      snippet,
      `SEO helpers must include JSON-LD snippet ${snippet}`,
    );
  }

  requireSnippet(
    violations,
    SITEMAP_FILE,
    sitemap,
    "source.getPages()",
    "Sitemap must include all Fumadocs pages",
  );
  requireSnippet(
    violations,
    ROBOTS_FILE,
    robots,
    "Sitemap:",
    "robots.txt must advertise the sitemap",
  );
  requireSnippet(
    violations,
    ROBOTS_FILE,
    robots,
    "Content-Signal:",
    "robots.txt must declare content signals",
  );
  for (const snippet of [
    "HTML_CACHE_CONTROL",
    "ONE_DAY_SECONDS",
    'source: "/"',
    'source: "/docs"',
    'source: "/docs/:path*"',
  ]) {
    requireSnippet(
      violations,
      NEXT_CONFIG_FILE,
      nextConfig,
      snippet,
      `Next config must include HTML cache snippet ${snippet}`,
    );
  }

  return violations;
}

function main() {
  const { pages, violations: docsViolations } = validateDocsPages();
  const violations = [
    ...docsViolations,
    ...validateSharedMetadata(),
    ...validateRouteWiring(),
  ];

  if (violations.length === 0) {
    console.log(
      `SEO audit passed for ${pages.length} docs pages (${TITLE_MIN_LENGTH}-${TITLE_MAX_LENGTH} char titles, ${DESCRIPTION_MIN_LENGTH}-${DESCRIPTION_MAX_LENGTH} char descriptions).`,
    );
    return;
  }

  console.error(`SEO audit failed with ${violations.length} issue(s).`);

  for (const violation of violations) {
    console.error(
      `- ${violation.filePath}:${violation.line} ${violation.message}`,
    );
  }

  process.exit(1);
}

main();
