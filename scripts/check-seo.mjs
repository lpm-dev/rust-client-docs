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
const ROBOTS_FILE = path.join(ROOT_DIR, "app", "robots.ts");

const TITLE_MIN_LENGTH = 50;
const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MIN_LENGTH = 150;
const DESCRIPTION_MAX_LENGTH = 160;

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
  return /^lpm\b/.test(title);
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

function docsSeoTitle(title) {
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

function normalizeSeoText(value) {
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

function docsSeoContexts(slugs, title) {
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
    `${normalizedBase} Learn how it fits into lpm installs, scripts, registries, security checks, workspaces, and CI workflows.`,
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
    const title = docsSeoTitle(frontmatter.title);
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
    "sitemap:",
    "Robots metadata must advertise the sitemap",
  );

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
