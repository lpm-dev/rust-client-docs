# LPM Rust Client — Documentation

Docs site for the [LPM Rust client](https://github.com/lpm-dev/rust-client).
Deployed to [cli.lpm.dev](https://cli.lpm.dev).

Built with [Fumadocs](https://fumadocs.dev) on Next.js.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
```

## Build

```bash
npm run build
npm start
```

## Deployment

Pushed to `main` → Coolify auto-deploys via Nixpacks (Next.js auto-detected,
no `Dockerfile` needed). Same pattern as `a-package-manager`.

### Environment variables

| Var | Purpose |
|---|---|
| `BUILD_TIME` | ISO timestamp set during build (`export BUILD_TIME=$(date -u +%FT%TZ)`). Stamps `lastModified` on static sitemap entries. Falls back to process start. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public PostHog project key (shared with `lpm.dev` — segment by `$host` for docs-only views). |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog ingest host. `https://eu.i.posthog.com`. |
| `POSTHOG_PERSONAL_API_KEY` | Personal API key for source-map upload during build. Optional. |
| `POSTHOG_PROJECT_ID` | `127102`. Pairs with the personal key above. |
| `INDEXNOW_KEY` | Per-host IndexNow ownership key. **Use** `d8a67742ffdd149c66e9c07d26850c40` for `cli.lpm.dev`. Served at `/indexnow-key.txt`. |
| `CRON_SECRET` | Bearer token guarding `/api/cron/indexnow-sync`. |

### Post-deploy hook (Coolify)

After every successful deploy, hit the IndexNow sync route once so Bing/Yandex
re-fetch the sitemap entries. Static pages carry `BUILD_TIME`, so a fresh
deploy brings them into the 48h lookback window automatically.

```bash
curl -sf -H "Authorization: Bearer $CRON_SECRET" \
  "https://cli.lpm.dev/api/cron/indexnow-sync"
```

For first-run backfill (one-time, when first wiring up IndexNow):

```bash
curl -sf -H "Authorization: Bearer $CRON_SECRET" \
  "https://cli.lpm.dev/api/cron/indexnow-sync?full=1"
```

Google ignores IndexNow but picks up changes from
[`/sitemap.xml`](https://cli.lpm.dev/sitemap.xml) — no extra action needed
beyond verifying the property in Search Console.

## Content

Docs live under [content/docs/](./content/docs). Each section is a folder
with a `meta.json` that controls sidebar ordering and grouping.

```
content/docs/
├── index.mdx                  Welcome
├── getting-started/           Installation, first install, migrating
├── commands/                  Flat reference, grouped via meta.json
├── features/                  Narrative tour of capabilities
├── guides/                    Task-oriented walkthroughs
├── configuration/             package.json, lpm.json, lpm.toml, config.toml
└── reference/                 Exit codes, file formats, glossary
```

Content is intentionally stubbed — written from the live Rust client source
as development proceeds.

## Scripts

| Script | What |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run types:check` | Type-check MDX frontmatter and TS source |
| `npm run lint` | Biome lint (check only) |
| `npm run lint:fix` | Biome lint + format, writing fixes |
| `npm run format` | Biome format only |
| `npm run test:unit` | Run Vitest unit tests |
| `npm run test:unit:watch` | Run Vitest in watch mode |

## License

MIT.
