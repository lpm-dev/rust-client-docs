import Link from "next/link";
import { homeJsonLd, safeJsonLd } from "@/lib/seo";
import { appName, appTagline } from "@/lib/shared";

const features = [
  {
    title: "Fast install.",
    body: "Cold installs land in 880ms — npm takes 6.8 seconds. Warm installs in 23ms. Content-addressable store, clonefile on macOS, zero-parse mmap'd lockfile.",
    cmd: "$ lpm install",
    href: "/docs/packages/install",
  },
  {
    title: "Sigstore-verified.",
    body: "Every package checked end-to-end on install — DSSE attestations, Rekor inclusion proofs, SCTs, and the full X.509 chain. Includes attestations served by npmjs, not just lpm.dev.",
    cmd: "$ lpm install ✓",
    href: "/docs/packages/security-audit",
  },
  {
    title: "Real OS sandbox.",
    body: "Lifecycle scripts blocked by default and, when they run, execute inside seatbelt (macOS), landlock + seccomp (Linux), or AppContainer (Windows).",
    cmd: "$ lpm approve-scripts",
    href: "/docs/packages/approve-scripts",
  },
  {
    title: "Secrets vault.",
    body: "Per-project secrets in your OS keychain, end-to-end encrypted sync across teammates, platform pushes that never route plaintext through our servers.",
    cmd: "$ lpm env push",
    href: "/docs/infra/secrets-vault",
  },
  {
    title: "Dev orchestrator.",
    body: "One command brings up your whole stack: pinned Node, fresh deps, loaded env, HTTPS, claimable public tunnels with webhook capture, multi-service ready-checks.",
    cmd: "$ lpm dev",
    href: "/docs/dev/dev",
  },
  {
    title: "Trusted publishing.",
    body: "OIDC trusted publishers replace long-lived API tokens. Auto-OIDC token exchange in GitHub Actions and GitLab CI; provenance signed on every release.",
    cmd: "$ lpm publish --provenance",
    href: "/docs/packages/publish",
  },
];

const moreFeatures = [
  {
    title: "Source, not deps.",
    body: "shadcn-style: extracts package source into your repo from any registry — npm, lpm.dev, private. Files land in your repo; you own and edit them.",
    cmd: "$ lpm add",
    href: "/docs/packages/add",
  },
  {
    title: "Every dep, X-rayed.",
    body: "OSV vulns, behavioral flags (eval, child_process, network), and CSS-like selectors as CI gates across every installed package.",
    cmd: "$ lpm audit",
    href: "/docs/packages/audit",
  },
  {
    title: "No npx tax.",
    body: "lpm fmt in 13ms vs npx biome at 264ms — 20× faster. Lint, fmt, test, runner all native and lazy-downloaded.",
    cmd: "$ lpm fmt",
    href: "/docs/dev/fmt",
  },
  {
    title: "Local dev infra.",
    body: "One root CA trusted once. Every project gets browser-accepted HTTPS, public tunnels with webhook replay, multi-service ready-checks.",
    cmd: "$ lpm dev",
    href: "/docs/dev/dev",
  },
  {
    title: "Deps, visualized.",
    body: "Interactive HTML graph, Mermaid output, terminal tree — built offline from your lockfile. --why <pkg> traces any path.",
    cmd: "$ lpm graph",
    href: "/docs/infra/graph",
  },
  {
    title: "Monorepo, native.",
    body: "Filter DSL (web..., [origin/main]), workspace:* protocol, catalogs for shared versions, lpm deploy to ship one member.",
    cmd: "$ lpm deploy",
    href: "/docs/packages/workspaces",
  },
];

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload is escaped by safeJsonLd
        dangerouslySetInnerHTML={safeJsonLd(homeJsonLd())}
      />

      <section className="flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          {appName}
        </h1>
        <p className="text-lg sm:text-xl text-fd-muted-foreground max-w-2xl mb-4">
          {appTagline}
        </p>
        <p className="text-sm sm:text-base text-fd-muted-foreground max-w-xl mb-10 leading-relaxed">
          Modern apps are a patchwork of npm, nvm, Turborepo, ngrok, mkcert,
          dotenv-vault, and shadcn-cli. LPM-cli brings install, task cache,
          runtime, env, HTTPS, tunnels, and source delivery into one Rust
          binary.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs"
            className="inline-flex items-center rounded-md bg-fd-primary text-fd-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
          >
            Get Started
          </Link>
          <Link
            href="/docs/commands"
            className="inline-flex items-center rounded-md border border-fd-border px-5 py-2.5 text-sm font-medium hover:bg-fd-muted transition"
          >
            Commands
          </Link>
        </div>
      </section>

      <section className="border-t border-fd-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-xs font-mono tracking-wider text-fd-muted-foreground uppercase mb-3">
            ◆ Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-2xl">
            The whole toolchain.{" "}
            <span className="text-fd-muted-foreground">In one binary.</span>
          </h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-fd-border border border-fd-border rounded-md overflow-hidden">
            {features.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="flex flex-col gap-3 p-7 min-h-[220px] bg-fd-background hover:bg-fd-muted/50 transition-colors"
              >
                <div className="text-lg font-semibold tracking-tight">
                  {f.title}
                </div>
                <p className="text-sm text-fd-muted-foreground leading-relaxed">
                  {f.body}
                </p>
                <code className="mt-auto self-start font-mono text-xs text-fd-primary bg-fd-muted px-3 py-1.5 rounded-md">
                  {f.cmd}
                </code>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-fd-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-xs font-mono tracking-wider text-fd-muted-foreground uppercase mb-3">
            ◆ More
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-2xl">
            Beyond install.{" "}
            <span className="text-fd-muted-foreground">
              What LPM-cli unlocks.
            </span>
          </h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-fd-border border border-fd-border rounded-md overflow-hidden">
            {moreFeatures.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="flex flex-col gap-3 p-7 min-h-[220px] bg-fd-background hover:bg-fd-muted/50 transition-colors"
              >
                <div className="text-lg font-semibold tracking-tight">
                  {f.title}
                </div>
                <p className="text-sm text-fd-muted-foreground leading-relaxed">
                  {f.body}
                </p>
                <code className="mt-auto self-start font-mono text-xs text-fd-primary bg-fd-muted px-3 py-1.5 rounded-md">
                  {f.cmd}
                </code>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
