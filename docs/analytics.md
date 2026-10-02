# CLI documentation acquisition

Website events include `app:cli`, `attribution_version:2`, and the first landing context for the current page lifetime.
The context includes `landing_path`, `landing_source`, and `landing_medium`.
Campaign parameters take precedence over the external referrer.
Unresolved self-referrals have `attribution_continuity:internal_referrer_without_external_source`.
This change cannot reconstruct historical attribution.

Without consent, PostHog uses daily server hashes and no browser identifiers.
This mode requires Cookieless tracking in the PostHog project settings.
The daily hash estimates visitors within one day. It does not provide permanent identity across days.
Analytics URLs exclude credentials, fragments, and query parameters other than approved campaign parameters.

## Events

| Event | Meaning |
| --- | --- |
| `cli_install_command_copied` | The clipboard accepts the homepage install command. |
| `cli_install_guide_clicked` | A visitor opens the installation guide through a link. |
| `cli_registry_clicked` | A visitor opens LPM.dev Registry through a link. |

These events measure intent. They do not prove that the CLI installed or that a visitor activated it.
The registry separately records authenticated package downloads and publications.
Those events do not measure CLI use with npm or other registries.

## Reports

Filter acquisition by `$host=cli.lpm.dev`, `attribution_version=2`, and `is_test_traffic=false`.
Use `landing_medium=organic` for the organic landing-to-intent funnel.
Cookieless visitors cannot reliably join to identified registry events. Report these populations separately.

For deployment checks, use `utm_source=codex-seo-verification`.
These events have `is_test_traffic=true` and remain outside customer conversion reports.
