import { getLandingAttribution } from "@/lib/posthog/attribution";
import { getPostHogClient } from "@/lib/posthog/client";

export function trackConversion(
  event: string,
  properties: Record<string, unknown> = {},
) {
  const attribution = getLandingAttribution();
  void getPostHogClient()
    .then((posthog) => {
      posthog?.capture(
        event,
        { ...attribution, ...properties, app: "cli", attribution_version: 2 },
        { send_instantly: true, transport: "sendBeacon" },
      );
    })
    .catch(() => {});
}

export function observeConversionLinks() {
  function clicked(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a[href]");
    if (!link) return;
    const destination = new URL((link as HTMLAnchorElement).href);
    let name = "";
    if (
      destination.hostname === window.location.hostname &&
      destination.pathname === "/docs/installation"
    )
      name = "cli_install_guide_clicked";
    else if (destination.hostname === "lpm.dev") name = "cli_registry_clicked";
    if (name)
      trackConversion(name, {
        current_path: window.location.pathname,
        destination_host: destination.hostname,
        destination_path: destination.pathname,
      });
  }
  document.addEventListener("click", clicked, true);
  return () => document.removeEventListener("click", clicked, true);
}
