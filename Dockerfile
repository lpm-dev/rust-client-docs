# syntax=docker/dockerfile:1

FROM node:22.23.4-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY package.json package-lock.json ./
# The package's postinstall generates files from the docs content, which isn't
# copied yet, so the build stage runs it. @posthog/cli's script downloads the
# binary the build uploads source maps with.
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
	npm ci --ignore-scripts --no-audit --no-fund \
	&& npm rebuild @posthog/cli esbuild

FROM base AS production-dependencies
COPY package.json package-lock.json ./
# npm 10 installs the native packages built for musl and WebAssembly too, which
# this glibc image never loads.
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
	npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
	&& rm -rf node_modules/@next/swc-*-musl node_modules/@img/*linuxmusl* node_modules/@img/sharp-wasm32

FROM dependencies AS build
# The PostHog CLI, which uploads source maps when the build has its key,
# needs the system's CA certificates.
RUN apt-get update \
	&& apt-get install --yes --no-install-recommends ca-certificates \
	&& rm -rf /var/lib/apt/lists/*
COPY . .
# The build reads these variables, and the image keeps none of them.
# npm run deploy:docs in a-package-manager passes them from Coolify.
RUN --mount=type=secret,id=NEXT_PUBLIC_POSTHOG_KEY,env=NEXT_PUBLIC_POSTHOG_KEY,required=true \
	--mount=type=secret,id=NEXT_PUBLIC_POSTHOG_HOST,env=NEXT_PUBLIC_POSTHOG_HOST,required=true \
	--mount=type=secret,id=INDEXNOW_KEY,env=INDEXNOW_KEY,required=true \
	--mount=type=secret,id=POSTHOG_PERSONAL_API_KEY,env=POSTHOG_PERSONAL_API_KEY \
	--mount=type=secret,id=POSTHOG_PROJECT_ID,env=POSTHOG_PROJECT_ID \
	npm run postinstall \
	&& npm run build \
	&& rm -rf .next/cache/webpack

FROM base AS runtime
# The health check runs curl in the container.
RUN apt-get update \
	&& apt-get install --yes --no-install-recommends ca-certificates curl tini \
	&& rm -rf /var/lib/apt/lists/* \
	&& useradd --system --user-group --uid 10004 --no-create-home --shell /usr/sbin/nologin docs
# The heap cap is about 3.8 times the live heap measured after a full GC.
# glibc's per-thread malloc arenas fragment a long-running Node process; two
# are enough.
ENV NODE_ENV=production \
	PORT=3000 \
	NODE_OPTIONS=--max-old-space-size=512 \
	MALLOC_ARENA_MAX=2
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/skills ./skills
COPY --from=build /app/lib/content-negotiation.mjs /app/lib/vary.mjs ./lib/
COPY --from=build /app/package.json /app/next.config.mjs /app/source.config.ts /app/server.mjs /app/server-drain.mjs ./
# Only .next is writable: the server keeps its caches and regenerated pages there.
COPY --from=build --chown=docs:docs /app/.next ./.next
ARG SOURCE_COMMIT
ENV APP_VERSION=$SOURCE_COMMIT
LABEL org.opencontainers.image.source="https://github.com/lpm-dev/rust-client-docs" \
	org.opencontainers.image.revision=$SOURCE_COMMIT
USER docs
EXPOSE 3000
# Stopping sends SIGUSR2: /api/ready fails, two checks later Docker marks the
# container unhealthy and Traefik stops routing to it, and after the drain the
# server closes once its requests finish (server.mjs). The drain covers
# retries × interval plus 2 s, leaving most of Coolify's 30 s grace period for
# requests in flight. Coolify replaces this health check with its own
# settings, which a-package-manager's audit requires to match it.
ENV DOCS_SHUTDOWN_DRAIN_MS=12000
STOPSIGNAL SIGUSR2
HEALTHCHECK --interval=5s --timeout=3s --start-period=20s --start-interval=1s --retries=2 \
	CMD ["curl", "--fail", "--silent", "--show-error", "--output", "/dev/null", "http://127.0.0.1:3000/api/ready"]
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.mjs"]
