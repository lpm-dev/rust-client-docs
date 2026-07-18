# React improvement plans

All plans were written against commit `bfed31a`. Execute them in numeric order unless a plan says otherwise. The first plan establishes the browser-like test harness used by the interaction fixes that follow.

| Plan | Status | Severity | Work | Depends on |
| --- | --- | --- | --- | --- |
| [001](001-add-client-interaction-tests.md) | DONE | MEDIUM | Add client-component interaction test coverage | — |
| [002](002-report-clipboard-results-honestly.md) | DONE | MEDIUM | Report clipboard success and failure honestly | 001 |
| [003](003-announce-copy-status.md) | DONE | MEDIUM | Give the copy control a stable name and live status | 001, 002 |
| [004](004-fix-mobile-menu-focus.md) | DONE | MEDIUM | Fix mobile navigation disclosure semantics and Escape focus | 001 |
| [005](005-harden-posthog-pageviews.md) | DONE | MEDIUM | Cancel stale pageviews and recover from PostHog load failures | 001 |
| [006](006-make-reveals-progressive.md) | DONE | LOW | Keep reveal content visible without working client JavaScript | 001 |
| [007](007-add-browser-security-headers.md) | DONE | MEDIUM | Add report-only CSP and baseline browser hardening headers | — |
| [008](008-self-host-og-fonts.md) | DONE | MEDIUM | Remove runtime Google Fonts fetches from OG generation | — |
| [009](009-remove-unused-mdx-export.md) | DONE | LOW | Remove the unused MDX alias export | — |
| [010](010-remove-dead-server-posthog.md) | DONE | LOW | Remove unreachable server PostHog code and dependency | — |
| [011](011-reduce-logo-svg-precision.md) | DONE | LOW | Round duplicated logo SVG path precision | — |

## Coverage map

- Audit findings 1–8 map to plans 002–006 and 009–011.
- Additional opportunity “client interaction tests” maps to plan 001.
- Additional opportunity “security headers/CSP” maps to plan 007.
- Additional opportunity “self-contained OG assets” maps to plan 008.

## Execution notes

- Plans 002 and 003 intentionally touch different parts of `copy-button.tsx`; execute 002 first, then preserve its state machine while applying 003's markup and announcements.
- Plans 005 and 010 concern separate PostHog paths. Plan 005 retains and hardens browser analytics; plan 010 removes only the unreachable server-side modules and `posthog-node` dependency.
- After each plan, run its focused verification. After the final plan, run `npm run check` and a full `npx react-doctor@latest --json` scan.
- Update each row's status to `DONE` only after its mechanical and behavioral checks pass.
