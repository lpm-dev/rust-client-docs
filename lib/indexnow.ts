// IndexNow — push-notify search engines when public URLs change.
// Bing/Yandex/Seznam participate; Google ignores it but picks up changes via
// sitemap. Submitting to the api.indexnow.org gateway fans out to all
// participating engines, so one request per event is enough.
//
// Spec: https://www.indexnow.org/documentation
// Key setup: generated once with `openssl rand -hex 16`, set as INDEXNOW_KEY
// in env. The key is served at /indexnow-key.txt so engines can verify
// ownership of cli.lpm.dev.

import { siteUrl } from "@/lib/shared";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const KEY_PATH = "/indexnow-key.txt";

type NotifyResult =
  | { sent: number; skipped?: undefined; reason?: undefined }
  | { sent: 0; skipped: true; reason: string };

/**
 * Push URL(s) to IndexNow. Fire-and-forget safe — rejects are swallowed.
 * Only absolute URLs under the configured site URL are sent; others are
 * dropped (IndexNow requires all URLs share the declared host).
 */
export async function notifyIndexNow(
  urls: string | string[],
): Promise<NotifyResult> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return { sent: 0, skipped: true, reason: "unconfigured" };
  }

  let host: string;
  try {
    host = new URL(siteUrl).host;
  } catch {
    return { sent: 0, skipped: true, reason: "invalid_site_url" };
  }

  const urlList = Array.isArray(urls) ? urls : [urls];
  const hostPrefix = `https://${host}`;
  const validUrls = urlList.filter(
    (u) => typeof u === "string" && u.startsWith(hostPrefix),
  );
  if (validUrls.length === 0) {
    return { sent: 0, skipped: true, reason: "no_valid_urls" };
  }

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${hostPrefix}${KEY_PATH}`,
        urlList: validUrls,
      }),
    });
    // 200/202 = accepted. 422 = invalid URL list. 429 = rate limited.
    if (!res.ok) {
      console.warn(
        `[IndexNow] ${res.status} ${res.statusText} for ${validUrls.length} url(s)`,
      );
    }
    return { sent: validUrls.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[IndexNow] network error:", message);
    return { sent: 0, skipped: true, reason: "network_error" };
  }
}
