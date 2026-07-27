---
name: using-lpm-cli
description: Operate the lpm CLI in a JavaScript, TypeScript, or Swift project — install and manage dependencies, run security audits, handle blocked lifecycle scripts, use the dev orchestrator, manage env secrets and tunnels, work in monorepos, and migrate from npm or pnpm. Triggers on "lpm install", "install with lpm", "lpm add", "add package", "lpm audit", "is this dependency safe", "scripts blocked", "postinstall blocked", "approve scripts", "lpm rebuild", "lpm dev", "dev server", "lpm env", "env secrets", "tunnel", "expose localhost", "workspace", "monorepo", "filter", "migrate from npm", "migrate from pnpm", "switch to lpm", "lockfile conflict", "lpm.lock", ".npmrc", "registry auth", "private registry", "swift package", "lpm command not found".
---

# Using the lpm CLI

lpm is a registry-agnostic package manager and dev toolkit in one Rust binary. It is a drop-in replacement for npm/pnpm in any JavaScript project: packages resolve from npmjs.org by default, `.npmrc` overrides are respected, and only `@lpm.dev/*` packages route through the lpm.dev registry. It also manages Swift packages via SwiftPM's registry protocol.

Match the task to a row below, then **fetch the linked page** — every page is markdown (this site serves any docs URL as markdown when you append `.mdx`).

## The one distinction that prevents most mistakes

- `lpm install <pkg>` — adds a **dependency** (writes package.json, resolves, links into node_modules). This is what `npm install` / `pnpm add` do.
- `lpm fetch` — reads `lpm.lock` only and warms the store; use before offline frozen installs in Docker layers.
- `lpm tidy` — reports unused dependency declarations and undeclared imports; `--fix` prunes unused dependency entries.
- `lpm add <pkg>` — **copies a package's source files into the repo** (shadcn-style source delivery). It does NOT install a dependency.

Never use `lpm add` to add a dependency. Details: [install](https://cli.lpm.dev/docs/packages/install.mdx) · [add](https://cli.lpm.dev/docs/packages/add.mdx)

## Quickstart

```bash
lpm install              # install all deps from package.json
lpm install --recursive  # widen a member install to its owning workspace
lpm install zod          # add a dependency (saves "^x.y.z")
lpm uninstall zod        # remove a dependency
lpm run build            # run a package.json script
lpm dlx cowsay hi        # run a package binary without installing
lpm audit                # OSV vulnerabilities + behavioral analysis
lpm dev                  # start the orchestrated dev environment
```

## Workflows

| Task | Guide |
|------|-------|
| Install the CLI itself | [Installation](https://cli.lpm.dev/docs/installation.mdx) |
| First install in an existing project | [First install](https://cli.lpm.dev/docs/first-install.mdx) |
| Add / remove / upgrade dependencies | [install](https://cli.lpm.dev/docs/packages/install.mdx) · [fetch](https://cli.lpm.dev/docs/packages/fetch.mdx) · [tidy](https://cli.lpm.dev/docs/packages/tidy.mdx) · [uninstall](https://cli.lpm.dev/docs/packages/uninstall.mdx) · [upgrade](https://cli.lpm.dev/docs/packages/upgrade.mdx) · [outdated](https://cli.lpm.dev/docs/packages/outdated.mdx) |
| Copy a package's source into the repo | [add](https://cli.lpm.dev/docs/packages/add.mdx) |
| Audit dependencies (vulns, behaviors, CI gates) | [audit](https://cli.lpm.dev/docs/packages/audit.mdx) · [query](https://cli.lpm.dev/docs/packages/query.mdx) · [security model](https://cli.lpm.dev/docs/packages/security-audit.mdx) |
| Lifecycle scripts blocked after install | [approve-scripts](https://cli.lpm.dev/docs/packages/approve-scripts.mdx) · [rebuild](https://cli.lpm.dev/docs/packages/rebuild.mdx) |
| Understand how version ranges are saved | [Save policy](https://cli.lpm.dev/docs/packages/save-policy.mdx) |
| Lockfile questions or merge conflicts | [Lockfile](https://cli.lpm.dev/docs/packages/lockfile.mdx) |
| Dev server, runtime pinning, HTTPS | [lpm dev](https://cli.lpm.dev/docs/dev/dev.mdx) · [zero-config dev server](https://cli.lpm.dev/docs/guides/zero-config-dev-server.mdx) |
| Env vars and secrets (local + team sync) | [lpm env](https://cli.lpm.dev/docs/dev/env.mdx) · [managing secrets](https://cli.lpm.dev/docs/guides/managing-secrets.mdx) |
| Expose localhost via public tunnel | [Tunneling](https://cli.lpm.dev/docs/infra/tunneling.mdx) |
| Monorepos: workspaces, filters, catalogs | [Workspaces](https://cli.lpm.dev/docs/packages/workspaces.mdx) · [monorepo setup](https://cli.lpm.dev/docs/guides/monorepo-setup.mdx) |
| Migrate a project from npm or pnpm | [from npm](https://cli.lpm.dev/docs/guides/migrating-from-npm.mdx) · [from pnpm](https://cli.lpm.dev/docs/guides/migrating-from-pnpm.mdx) · [overview](https://cli.lpm.dev/docs/migrating.mdx) |
| Private registries and auth tokens | [Registries](https://cli.lpm.dev/docs/registries.mdx) · [Authentication](https://cli.lpm.dev/docs/infra/authentication.mdx) |
| CI/CD installs and publishing | [CI/CD setup](https://cli.lpm.dev/docs/guides/ci-cd-setup.mdx) |
| Swift / SwiftPM packages | [Using with Swift](https://cli.lpm.dev/docs/guides/using-with-swift.mdx) |
| Config files and env vars reference | [Config](https://cli.lpm.dev/docs/infra/config.mdx) · [Env vars](https://cli.lpm.dev/docs/reference/env-vars.mdx) |
| Something behaves oddly | [doctor](https://cli.lpm.dev/docs/infra/doctor.mdx) · [npm compatibility](https://cli.lpm.dev/docs/packages/npm-compatibility.mdx) |
| Flat list of every command | [Commands](https://cli.lpm.dev/docs/commands.mdx) |

## Behaviors to know before acting

- **Dependency lifecycle scripts are blocked by default** (supply-chain protection). After an install reports blocked scripts, run `lpm approve-scripts` to review and approve, then `lpm rebuild` to execute them sandboxed. Do not switch package managers to "fix" this.
- **`lpm rebuild` runs lifecycle scripts; there is no `lpm build` command.**
- **Saved ranges:** `lpm install zod` saves `"^x.y.z"`. Explicit input (`zod@4.3.6`, `zod@^4.3.0`) is preserved verbatim; prereleases save exact.
- **Workspace roots recurse by default:** bare `lpm install` installs members in dependency order and the root last. Inside a member it stays local unless `--recursive` is passed. Use `--no-recursive` for a root-only refresh.
- **Typosquat guard:** new direct names that look like popular packages fail in CI/non-TTY/`--json`/`--yes` runs with `error_code: "typosquat_suspected"`. Interactive prompts default to cancel; choose the suggested package or commit a `lpm.toml > policy.typosquat.allow` entry with a reason only when that package name is intentional. Machine-wide mode is `lpm config typosquat --set default|on|off`; `default` removes the override, `on` ignores the diagnostic env toggle, and `off` is security-approval-gated. Prefer allow-listing legitimate names over turning the guard off globally.
- **Lockfiles are committed:** always commit `lpm.lock` (TOML, diffable). Commit `lpm.lockb` when LPM writes it; do not synthesize it for TOML-only lockfiles.
- **Monorepos auto-use isolated (pnpm-style) linking;** single-package projects use hoisted (npm-style). Override with `--linker=isolated|hoisted`.
- **Registry auth setup is `lpm setup-npmrc`** (writes scoped `.npmrc` entries).
- **Secrets are `lpm env`** (`lpm env push` / `lpm env pull` for team sync). There is no `lpm vault` command.
- **For Swift packages use `lpm install`**, the same as JavaScript.

## Full documentation index

- [llms.txt](https://cli.lpm.dev/llms.txt) — index of every docs page with markdown URLs
- [llms-full.txt](https://cli.lpm.dev/llms-full.txt) — entire docs corpus as one markdown file
- Any page: append `.mdx` to its URL, or request it with `Accept: text/markdown`
