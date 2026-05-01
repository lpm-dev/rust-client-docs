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
