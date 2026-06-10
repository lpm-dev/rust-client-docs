import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { homeJsonLd, safeJsonLd } from "@/lib/seo";
import {
  appName,
  gitConfig,
  homeSeoDescription,
  homeSeoTitle,
  registryUrl,
  siteUrl,
} from "@/lib/shared";
import { CopyButton } from "./_components/copy-button";
import { Reveal } from "./_components/reveal";
import { TypedHero } from "./_components/typed-hero";
import "./home.css";

const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

const INSTALL_CMD = "curl -fsSL https://cli.lpm.dev/install | sh";

export const metadata: Metadata = {
  title: {
    absolute: homeSeoTitle,
  },
  description: homeSeoDescription,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    siteName: appName,
    title: homeSeoTitle,
    description: homeSeoDescription,
    url: siteUrl,
    images: [
      {
        url: "/og/home",
        width: 1200,
        height: 630,
        alt: homeSeoTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: homeSeoTitle,
    description: homeSeoDescription,
    images: ["/og/home"],
  },
};

type Feature = {
  title: string;
  body: string;
  cmd: string;
  href: string;
};

const FEATURES: Feature[] = [
  {
    title: "Fast install",
    body: "Cold installs land in 880ms — npm takes 6.8 seconds. Warm installs in 23ms. Content-addressable store, clonefile on macOS, zero-parse mmap'd lockfile.",
    cmd: "$ lpm install",
    href: "/docs/packages/install",
  },
  {
    title: "Sigstore-verified",
    body: "Every package checked end-to-end on install — DSSE attestations, Rekor inclusion proofs, SCTs, and the full X.509 chain. Includes attestations served by npmjs, not just lpm.dev.",
    cmd: "$ lpm install ✓",
    href: "/docs/packages/security-audit",
  },
  {
    title: "Real OS sandbox",
    body: "Lifecycle scripts blocked by default and, when they run, execute inside seatbelt (macOS), landlock + seccomp (Linux), or AppContainer (Windows).",
    cmd: "$ lpm approve-scripts",
    href: "/docs/packages/approve-scripts",
  },
  {
    title: "Secrets vault",
    body: "Per-project secrets in your OS keychain, end-to-end encrypted sync across teammates, platform pushes that never route plaintext through our servers.",
    cmd: "$ lpm env push",
    href: "/docs/infra/secrets-vault",
  },
  {
    title: "Dev orchestrator",
    body: "One command brings up your whole stack: pinned Node, fresh deps, loaded env, HTTPS, claimable public tunnels with webhook capture, multi-service ready-checks.",
    cmd: "$ lpm dev",
    href: "/docs/dev/dev",
  },
  {
    title: "Trusted publishing",
    body: "OIDC trusted publishers replace long-lived API tokens. Auto-OIDC token exchange in GitHub Actions and GitLab CI; provenance signed on every release.",
    cmd: "$ lpm publish --provenance",
    href: "/docs/packages/publish",
  },
];

const MORE: Feature[] = [
  {
    title: "Source, not deps",
    body: "shadcn-style: extracts package source into your repo from any registry — npm, lpm.dev, private. Files land in your repo; you own and edit them.",
    cmd: "$ lpm add",
    href: "/docs/packages/add",
  },
  {
    title: "Every dep, X-rayed",
    body: "OSV vulns, behavioral flags (eval, child_process, network), and CSS-like selectors as CI gates across every installed package.",
    cmd: "$ lpm audit",
    href: "/docs/packages/audit",
  },
  {
    title: "No npx tax",
    body: "lpm fmt in 13ms vs npx biome at 264ms — 20× faster. Lint, fmt, test, runner all native and lazy-downloaded.",
    cmd: "$ lpm fmt",
    href: "/docs/dev/fmt",
  },
  {
    title: "Local dev infra",
    body: "One root CA trusted once. Every project gets browser-accepted HTTPS, public tunnels with webhook replay, multi-service ready-checks.",
    cmd: "$ lpm dev",
    href: "/docs/dev/dev",
  },
  {
    title: "Deps, visualized",
    body: "Interactive HTML graph, Mermaid output, terminal tree — built offline from your lockfile. --why <pkg> traces any path.",
    cmd: "$ lpm graph",
    href: "/docs/infra/graph",
  },
  {
    title: "Monorepo, native",
    body: "Filter DSL (web..., [origin/main]), workspace:* protocol, catalogs for shared versions, lpm deploy to ship one member.",
    cmd: "$ lpm deploy",
    href: "/docs/packages/workspaces",
  },
];

type FootLink = {
  label: string;
  href: string;
};

const FOOTER: { heading: string; links: FootLink[] }[] = [
  {
    heading: "Get started",
    links: [
      { label: "LPM CLI", href: "/docs" },
      { label: "How to install", href: "/docs/installation" },
      { label: "Migration to LPM", href: "/docs/migrating" },
      { label: "Comparison", href: "/docs/comparison" },
    ],
  },
  // {
  //   heading: "Packages",
  //   links: [
  //     { label: "Save Policy", href: "/docs/packages/save-policy" },
  //     { label: "Security & Audit", href: "/docs/packages/security-audit" },
  //     { label: "Workspaces", href: "/docs/packages/workspaces" },
  //     { label: "NPM Compatibility", href: "/docs/packages/npm-compatibility" },
  //   ],
  // },
  {
    heading: "Development",
    links: [
      { label: "lpm dev", href: "/docs/dev/dev" },
      { label: "Managed runtimes", href: "/docs/dev/node-version-pinning" },
      { label: "Built-in tools", href: "/docs/dev/builtin-tools" },
      { label: "Environment variables", href: "/docs/dev/env" },
    ],
  },
  {
    heading: "Infrastructure",
    links: [
      { label: "Tunneling", href: "/docs/infra/tunneling" },
      { label: "Local HTTPS", href: "/docs/infra/local-https" },
      { label: "Dependency graph", href: "/docs/infra/dependency-graph" },
      { label: "Project health", href: "/docs/infra/project-health" },
    ],
  },
  {
    heading: "Guides",
    links: [
      { label: "Dev server", href: "/docs/guides/zero-config-dev-server" },
      { label: "Monorepo setup", href: "/docs/guides/monorepo-setup" },
      { label: "Managing secrets", href: "/docs/guides/managing-secrets" },
      { label: "Using LPM with Swift", href: "/docs/guides/using-with-swift" },
    ],
  },
  // {
  //   heading: "References",
  //   links: [
  //     { label: "Package.json", href: "/docs/reference/package-json-lpm" },
  //     { label: "lpm.json", href: "/docs/reference/lpm-json" },
  //     { label: "LPM security", href: "/docs/reference/security" },
  //     { label: "Config", href: "/docs/reference/config" },
  //     { label: "Self update", href: "/docs/reference/self-update" },
  //   ],
  // },
  {
    heading: "LPM",
    links: [
      { label: "LPM.dev Registry", href: registryUrl },
      { label: "GitHub", href: githubUrl },
      { label: "X/LPM_dev_", href: "https://x.com/LPM_dev_" },
    ],
  },
];

function FeatureGrid({ items, start }: { items: Feature[]; start: number }) {
  return (
    <div className="grid">
      {items.map((feature, index) => (
        <Link key={feature.title} href={feature.href} className="card">
          <div className="card-idx">
            {String(start + index).padStart(2, "0")}
          </div>
          <h3>{feature.title}</h3>
          <p>{feature.body}</p>
          <div className="cmd">{feature.cmd}</div>
        </Link>
      ))}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return <Link href={href}>{children}</Link>;
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is escaped by safeJsonLd
        dangerouslySetInnerHTML={safeJsonLd(homeJsonLd())}
      />

      <link rel="preconnect" href="https://api.fontshare.com" />
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap"
      />

      <div className="home-root">
        <div className="grain" aria-hidden="true" />

        <header className="home-hero">
          <TypedHero />
          <p className="hero-sub">
            Modern apps are a patchwork of npm, nvm, Turborepo, ngrok, mkcert,
            dotenv-vault, and shadcn-cli. LPM CLI brings install, task cache,
            runtime, env, HTTPS, tunnels, and source delivery into one Rust
            binary.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/docs">
              Get Started{" "}
              <span className="arr" aria-hidden="true">
                ↗
              </span>
            </Link>
            <Link className="btn btn-ghost" href="/docs/comparison">
              Comparison
            </Link>
          </div>
        </header>

        <section id="features" className="section">
          <Reveal className="sec-head">
            <div>
              <div className="sec-label">Features</div>
              <h2>
                The whole toolchain.{" "}
                <span className="light">In one binary.</span>
              </h2>
            </div>
          </Reveal>
          <FeatureGrid items={FEATURES} start={1} />
        </section>

        <section id="more" className="section">
          <Reveal className="sec-head">
            <div>
              <div className="sec-label">More</div>
              <h2>
                Beyond install.{" "}
                <span className="light">What LPM CLI unlocks.</span>
              </h2>
            </div>
          </Reveal>
          <FeatureGrid items={MORE} start={7} />
        </section>

        <Reveal as="section" id="install" className="section install">
          <h2>
            Power up your <span className="light">workflow.</span>
          </h2>
          <div className="copybox">
            <span>
              <span className="prmpt">$ </span>
              {INSTALL_CMD}
            </span>
            <CopyButton />
          </div>
        </Reveal>

        <footer>
          <div className="wrap">
            <div className="foot-grid">
              {FOOTER.map((column) => (
                <div key={column.heading} className="foot-col">
                  <h4>{column.heading}</h4>
                  {column.links.map((item) => (
                    <FooterLink key={item.label} href={item.href}>
                      {item.label}
                    </FooterLink>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="wrap">
            <div className="foot-meta">
              <span>© 2026 lpm.dev</span>
              <span>The fast, all-in-one toolkit for modern software.</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
