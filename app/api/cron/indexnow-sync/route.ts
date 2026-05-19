import { NextResponse } from "next/server";
import sitemap from "@/app/sitemap";
import { notifyIndexNow } from "@/lib/indexnow";
import { siteUrl } from "@/lib/shared";

/**
 * Bulk IndexNow push from the sitemap. Run on every deploy to cover docs
 * pages that have no runtime publish event — static routes carry BUILD_TIME
 * as lastModified, so a fresh deploy brings them into the lookback window.
 *
 * Auth: requires `Authorization: Bearer <CRON_SECRET>`.
 *
 * Query params:
 *   lookback=<hours>   default 48h — filter entries by lastModified
 *   full=1             ignore lookback, push every URL in the sitemap
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     "https://cli.lpm.dev/api/cron/indexnow-sync?full=1"
 */

const MAX_URLS_PER_BATCH = 10000;
const MAX_URLS_PER_RUN = 5000;

function unauthorized(): Response {
  return NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 401 },
  );
}

function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (!header) return false;
  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return false;
  // Constant-time comparison is overkill here (bearer is opaque, not a HMAC
  // signature) but cheap.
  if (value.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < value.length; i++) {
    diff |= value.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return diff === 0;
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return unauthorized();
  }

  if (!process.env.INDEXNOW_KEY) {
    return NextResponse.json(
      { success: false, error: "IndexNow not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const isFull = searchParams.get("full") === "1";
  const lookbackHours = Number.parseInt(
    searchParams.get("lookback") || "48",
    10,
  );

  try {
    const entries = sitemap();
    const cutoff = Date.now() - Math.max(1, lookbackHours) * 60 * 60 * 1000;

    const hostPrefix = siteUrl.replace(/\/$/, "");
    const filtered = entries
      .filter((e) => {
        if (!e.url.startsWith(hostPrefix)) return false;
        if (isFull) return true;
        const modified = e.lastModified
          ? new Date(e.lastModified).getTime()
          : Number.NaN;
        return Number.isFinite(modified) && modified >= cutoff;
      })
      .map((e) => e.url);

    if (filtered.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        total: entries.length,
        note: "No URLs in lookback window",
      });
    }

    const capped = filtered.slice(0, MAX_URLS_PER_RUN);
    const truncated = filtered.length - capped.length;

    let sent = 0;
    const errors: { batch: number; reason: string }[] = [];
    for (let i = 0; i < capped.length; i += MAX_URLS_PER_BATCH) {
      const batch = capped.slice(i, i + MAX_URLS_PER_BATCH);
      const result = await notifyIndexNow(batch);
      if (result.skipped) {
        errors.push({ batch: i / MAX_URLS_PER_BATCH, reason: result.reason });
      } else {
        sent += result.sent;
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      total: entries.length,
      filtered: filtered.length,
      truncated,
      lookbackHours: isFull ? null : lookbackHours,
      full: isFull,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[indexnow-sync]", message);
    return NextResponse.json(
      { success: false, error: "IndexNow sync failed", detail: message },
      { status: 500 },
    );
  }
}
