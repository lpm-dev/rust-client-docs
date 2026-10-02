type Properties = Record<string, unknown>;
let initialLanding: ReturnType<typeof landingAttribution> | null = null;

export function getLandingAttribution() {
  initialLanding ??= landingAttribution(
    window.location.href,
    document.referrer,
  );
  return initialLanding;
}

export function landingAttribution(url: string, referrer: string) {
  const landing = new URL(url);
  let domain = "";
  try {
    domain = new URL(referrer).hostname;
  } catch {
    /* Direct entry. */
  }
  const external = domain && domain !== landing.hostname;
  const source =
    landing.searchParams.get("utm_source") || (external ? domain : "direct");
  const medium =
    landing.searchParams.get("utm_medium") ||
    (external &&
    /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.yahoo\.com)$/.test(
      domain,
    )
      ? "organic"
      : external
        ? "referral"
        : "direct");
  return {
    landing_path: landing.pathname,
    landing_source: source,
    landing_medium: medium,
    is_test_traffic: source === "codex-seo-verification",
  };
}

export function safeAnalyticsUrl(value: string) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (
        !["utm_source", "utm_medium", "utm_campaign", "utm_content"].includes(
          key,
        )
      )
        url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return "";
  }
}

export function normalizeAnalyticsProperties(
  properties: Properties,
  hostname: string,
): Properties {
  const result = { ...properties };
  for (const key of [
    "$current_url",
    "$initial_current_url",
    "$referrer",
    "$initial_referrer",
  ]) {
    if (typeof result[key] === "string" && result[key] !== "$direct")
      result[key] = safeAnalyticsUrl(result[key] as string);
  }
  for (const prefix of ["$", "$initial_"]) {
    const domainKey = `${prefix}referring_domain`;
    const referrerKey = `${prefix}referrer`;
    let internal = result[domainKey] === hostname;
    try {
      internal ||=
        typeof result[referrerKey] === "string" &&
        new URL(result[referrerKey] as string).hostname === hostname;
    } catch {
      /* Direct entry. */
    }
    if (internal) {
      result[domainKey] = "$direct";
      result[referrerKey] = "$direct";
      result.attribution_continuity =
        "internal_referrer_without_external_source";
    }
  }
  return result;
}
