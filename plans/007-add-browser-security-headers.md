# 007 — Add browser security headers

- **Status**: DONE
- **Commit**: bfed31a
- **Severity**: MEDIUM
- **Category**: Security
- **Rule**: Beyond the scan
- **Estimated scope**: 2 files, about 95 lines

## Problem

`next.config.mjs:38` defines only cache headers for HTML responses:

    // next.config.mjs:38 — current
    const HTML_RESPONSE_HEADERS = [
      {
        key: "Cache-Control",
        value: HTML_CACHE_CONTROL,
      },
    ];

The deployed site currently receives HSTS and `X-Content-Type-Options: nosniff` from Cloudflare, but source configuration does not define CSP, clickjacking protection, referrer policy, or a permissions policy. It also exposes `X-Powered-By: Next.js`. There is no confirmed injection sink, so CSP should start in report-only mode and be validated before enforcement.

## Target

Add these exact constants near the existing header constants:

    const CONTENT_SECURITY_POLICY = [
      "default-src 'self'",
      "base-uri 'self'",
      "connect-src 'self' https://*.posthog.com wss://*.posthog.com",
      "font-src 'self' data:",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https:",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "worker-src 'self' blob:",
    ].join("; ");

    const SECURITY_RESPONSE_HEADERS = [
      {
        key: "Content-Security-Policy-Report-Only",
        value: CONTENT_SECURITY_POLICY,
      },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), geolocation=(), microphone=()",
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
    ];

Keep caching separate, add a global security-header rule first, and disable the framework signature:

    const config = {
      poweredByHeader: false,
      reactStrictMode: true,
      // existing config
      async headers() {
        return [
          {
            source: "/:path*",
            headers: SECURITY_RESPONSE_HEADERS,
          },
          {
            source: "/",
            headers: HTML_RESPONSE_HEADERS,
          },
          // existing /docs and /schemas rules unchanged
        ];
      },
    };

Create `tests/unit/security-headers.test.ts` and dynamically import `next.config.mjs`. Resolve `config.headers()`, locate the `/:path*` rule, and assert exact header values plus `poweredByHeader === false`.

## Repo conventions to follow

- Keep header constants at module scope beside `HTML_CACHE_CONTROL` and `HTML_RESPONSE_HEADERS`.
- Preserve existing cache, schema CORS/content-type, rewrite, redirect, MDX, and PostHog build configuration.
- Follow explicit Vitest imports and direct response/config assertions from `tests/unit/api-catalog.test.ts:1`.
- Treat the current Cloudflare HSTS header as deployment-owned; do not add a conflicting HSTS policy in application code.

## Steps

1. Add `CONTENT_SECURITY_POLICY` and `SECURITY_RESPONSE_HEADERS` exactly as shown.
2. Set `poweredByHeader: false` on the base Next config.
3. Add the global `/:path*` header rule before the route-specific cache/schema rules so Next combines them.
4. Add a unit test that asserts the full report-only policy string and every hardening header.
5. Run a production build and inspect headers locally or on a preview deployment.
6. Exercise homepage hydration, docs client navigation, search, theme switching, copy, PostHog `/a` requests, OG images, markdown negotiation, and schema routes while watching the browser console for CSP reports.
7. Record any required source in this plan before changing the policy; do not silently broaden directives.

## Boundaries

- Do NOT change `Content-Security-Policy-Report-Only` to enforcing `Content-Security-Policy` in this plan.
- Do NOT add `'unsafe-eval'`, wildcard `*`, `data:` to `script-src`, or broad `https:` to `connect-src`.
- Do NOT disable clipboard permissions; plan 002 depends on `clipboard-write` remaining available under the default browser policy.
- Do NOT remove `'unsafe-inline'` until the application has a nonce/hash design for Next bootstrap scripts, JSON-LD, and inline styles.
- Do NOT change Cloudflare, Coolify, DNS, or other external deployment settings.
- Do NOT add dependencies.
- STOP if `next.config.mjs` has drifted from commit `bfed31a`; report the drift instead of improvising a policy.

## Verification

- **Mechanical**:
  - `npx vitest run tests/unit/security-headers.test.ts` passes exact-value assertions.
  - `npm run types:check`, `npm run lint`, and `npm run build` pass.
  - `npx react-doctor@latest --scope changed` does not lower the score.
  - `curl -sSI <preview-url>/` and `/docs` show the report-only CSP, referrer policy, permissions policy, `DENY`, and `nosniff`, with no `X-Powered-By` header.
- **Behavior check**: In a production preview, complete the interactions listed in step 6. Confirm there are no unexpected CSP console reports and PostHog requests still reach only self or `*.posthog.com`. Confirm an iframe on another origin cannot render the site because `X-Frame-Options: DENY` is enforced.
- **Done when**: source-controlled hardening headers ship without breaking site behavior, the report-only policy has been exercised, and any future enforcement changes are explicitly deferred to a separately reviewed plan.
