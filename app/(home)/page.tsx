import Link from "next/link";
import { homeJsonLd, safeJsonLd } from "@/lib/seo";
import { appName, appTagline } from "@/lib/shared";

const features = [
  {
    title: "Fast install.",
    body: "Cold installs land in 880ms — npm takes 6.8 seconds. Warm installs in 23ms. Content-addressable store, clonefile on macOS, zero-parse mmap'd lockfile.",
    cmd: "$ lpm install",
  },
  {
    title: "Sigstore-verified.",
    body: "Every package checked end-to-end on install — DSSE attestations, Rekor inclusion proofs, SCTs, and the full X.509 chain. Includes attestations served by npmjs, not just lpm.dev.",
    cmd: "$ lpm install ✓",
  },
  {
    title: "Real OS sandbox.",
    body: "Lifecycle scripts blocked by default and, when they run, execute inside seatbelt (macOS), landlock + seccomp (Linux), or AppContainer (Windows).",
    cmd: "$ lpm approve-scripts",
  },
  {
    title: "Secrets vault.",
    body: "Per-project secrets in your OS keychain, end-to-end encrypted sync across teammates, platform pushes that never route plaintext through our servers.",
    cmd: "$ lpm env push",
  },
  {
    title: "Dev orchestrator.",
    body: "One command brings up your whole stack: pinned Node, fresh deps, loaded env, HTTPS, claimable public tunnels with webhook capture, multi-service ready-checks.",
    cmd: "$ lpm dev",
  },
  {
    title: "Trusted publishing.",
    body: "OIDC trusted publishers replace long-lived API tokens. Auto-OIDC token exchange in GitHub Actions and GitLab CI; provenance signed on every release.",
    cmd: "$ lpm publish --provenance",
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
          Modern apps are a patchwork of npm, nvm, ngrok, mkcert, dotenv-vault,
          Turborepo, and shadcn-cli. LPM-cli collapses all of it into one Rust
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
            One binary{" "}
            <span className="text-fd-muted-foreground">instead of six.</span>
          </h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-fd-border border border-fd-border rounded-md overflow-hidden">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-3 p-7 min-h-[220px] bg-fd-background"
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
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
