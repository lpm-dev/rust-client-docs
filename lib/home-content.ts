import { gitConfig, registryUrl } from "./shared";

export const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

export const INSTALL_CMD = "curl -fsSL https://cli.lpm.dev/install | sh";

export const HERO_SUB =
  "Modern apps are a patchwork of npm, nvm, Turborepo, ngrok, mkcert, dotenv-vault, and shadcn-cli. LPM CLI brings install, task cache, runtime, env, HTTPS, tunnels, and source delivery into one Rust binary.";

export type Feature = {
  title: string;
  body: string;
  cmd: string;
  href: string;
};

export const FEATURES: Feature[] = [
  {
    title: "Fast install",
    body: "Cold VitePress installs land in 2.9s vs npm at 17.4s. Warm installs in 387ms, up-to-date checks in 14ms.",
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

export const MORE: Feature[] = [
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
    body: "lpm fmt in 3ms vs npx biome at 269ms. lpm lint in 3ms vs npx oxlint at 249ms. Native runners, no per-invocation npx resolution.",
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
    href: "/docs/packages/graph",
  },
  {
    title: "Monorepo, native",
    body: "Filter DSL (web..., [origin/main]), workspace:* protocol, catalogs for shared versions, lpm deploy to ship one member.",
    cmd: "$ lpm deploy",
    href: "/docs/packages/workspaces",
  },
];

export const GUARDRAILS: Feature[] = [
  {
    title: "Firewall for npm",
    body: "Check public npm packages against firewall verdicts before tarballs are downloaded, with monitor mode for visibility and enforce mode for blocking.",
    cmd: "$ lpm config firewall",
    href: "/docs/guides/firewall",
  },
  {
    title: "Guarded settings",
    body: "Treat weaker flags, repo config, and agent-driven changes as proposals until an explicit unlock or approved machine policy says yes.",
    cmd: "$ lpm security status",
    href: "/docs/infra/security",
  },
  {
    title: "Behavior queries",
    body: "Search the installed tree with CSS-like selectors for eval, network, scripts, and vulnerabilities, then fail CI on matches.",
    cmd: "$ lpm query :critical",
    href: "/docs/packages/query",
  },
];

export type FootLink = {
  label: string;
  href: string;
};

export const FOOTER: { heading: string; links: FootLink[] }[] = [
  {
    heading: "Get started",
    links: [
      { label: "LPM CLI", href: "/docs" },
      { label: "How to install", href: "/docs/installation" },
      { label: "Migration to LPM", href: "/docs/migrating" },
      { label: "Comparison", href: "/docs/comparison" },
    ],
  },
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
  {
    heading: "LPM",
    links: [
      { label: "LPM.dev Registry", href: registryUrl },
      {
        label: "LPM Firewall",
        href: "https://firewall.lpm.dev",
      },
      { label: "GitHub", href: githubUrl },
      { label: "X/LPM_dev_", href: "https://x.com/LPM_dev_" },
    ],
  },
];
