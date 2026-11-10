# LPM Rust Client — Documentation

Docs site for the [LPM Rust client](https://github.com/lpm-dev/rust-client).
Deployed to [cli.lpm.dev](https://cli.lpm.dev).

## Scripts

| Script                    | What                                     |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Local dev server                         |
| `npm run build`           | Production build                         |
| `npm start`               | Run the production build                 |
| `npm run types:check`     | Type-check MDX frontmatter and TS source |
| `npm run lint`            | Biome lint (check only)                  |
| `npm run lint:fix`        | Biome lint + format, writing fixes       |
| `npm run format`          | Biome format only                        |
| `npm run test:unit`       | Run Vitest unit tests                    |
| `npm run test:unit:watch` | Run Vitest in watch mode                 |

## Deployment

Pushing to `main` doesn't deploy the site. After merging, run `npm run deploy:docs` in
`a-package-manager`. It fetches the commit from GitHub and builds `Dockerfile` on that machine
for `linux/amd64`. Then it pushes the image to GHCR, and the Coolify Docker Image application
for cli.lpm.dev pulls and runs it. The script waits until `https://cli.lpm.dev/api/ready` reports
the commit in `X-App-Version`.

The image runs `node server.mjs` under `tini`, as the unprivileged `docs` user, with production
dependencies only. Next.js standalone output can't serve a custom server, so the image doesn't use
it. The build context is the allowlist in `.dockerignore`, so a file the image needs must be
admitted there. The server reads `skills/` and `public/` at runtime, so the image copies them.

The build reads the variables the `RUN npm run build` step in `Dockerfile` mounts as BuildKit
secrets: the `NEXT_PUBLIC_POSTHOG_*` values, `INDEXNOW_KEY`, and, for the source-map upload,
`POSTHOG_PERSONAL_API_KEY` with `POSTHOG_PROJECT_ID`. The deploy script takes their values from
the Coolify application. The image keeps none of them. Without git history in the build context,
the content dates come from the committed `lib/generated/content-dates.json`, which
`npm run check:content-dates` keeps current.

Cloudflare compresses responses; the origin doesn't. After `npm run build`, the build writes a
maximum-quality brotli copy of each script, stylesheet and SVG in `.next/static`
(`scripts/compress-static-assets.mjs`), and `server.mjs` sends it to a client that accepts brotli
(`lib/precompressed-assets.mjs`). The copies are about 16% smaller than Cloudflare's own brotli.
Cloudflare caches them and converts them for a visitor without brotli.

Cloudflare caches the HTML of `/` and the `/docs` pages for browsers only. Its rule requires
`text/html,application/xhtml+xml` in Accept, and skips requests whose Accept names markdown or
`text/plain`, which get markdown, and Next's `rsc` requests. Cloudflare ignores `Vary`. Pages
send `s-maxage=86400`, and `npm run deploy:docs` purges them, the markdown, the sitemap and the
OG images once the new build serves.

The client loads PostHog's slim build, without session recording, exception capture, web vitals
or surveys. The search dialog loads when someone reaches for search, not on every page
(`components/search-preload.tsx`). On a phone, the sidebar's links prefetch once its drawer
opens: a closed drawer is still laid out, and Next would prefetch its links
(`components/docs-sidebar.tsx`).

The custom server loads `next.config.mjs` again when it starts. In that phase the config skips
Fumadocs and the GitHub release lookup, since only `next build` and `next dev` need them.

Docker's health check requests `/api/ready`, which reads no data. Docker stops the container with
`SIGUSR2` (`server.mjs`). The server keeps serving while `/api/ready` fails, so after two checks
Docker marks the container unhealthy and Traefik stops routing to it. After
`DOCS_SHUTDOWN_DRAIN_MS` (12 s), the server stops accepting connections and exits once its
requests finish. `SIGTERM` closes the same way without the drain. Coolify replaces the image's
health check with its own settings, and `a-package-manager`'s audit requires them to match the
Dockerfile's.

## License

MIT.
