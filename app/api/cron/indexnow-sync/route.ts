import sitemap from "@/app/sitemap";
import { apiProblem, methodNotAllowed } from "@/lib/api-problem";
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

function unauthorized(request: Request): Response {
  return apiProblem(request, {
    status: 401,
    code: "AUTH_REQUIRED",
    title: "Authentication required",
    message: "The cron endpoint requires a valid bearer token.",
    resolution: "Send the deployment CRON_SECRET as a bearer token.",
    headers: { "WWW-Authenticate": "Bearer" },
  });
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
    return unauthorized(request);
  }

  if (!process.env.INDEXNOW_KEY) {
    return apiProblem(request, {
      status: 503,
      code: "INDEXNOW_NOT_CONFIGURED",
      title: "IndexNow is not configured",
      message: "The deployment has no IndexNow key.",
      resolution: "Set INDEXNOW_KEY in the deployment environment.",
    });
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
      return Response.json({
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

    return Response.json({
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
    return apiProblem(request, {
      status: 500,
      code: "INDEXNOW_SYNC_FAILED",
      title: "IndexNow sync failed",
      message: "The IndexNow sync did not complete.",
      resolution: "Read the server log, correct the error, and retry the sync.",
    });
  }
}

const rejectUnsupportedMethod = methodNotAllowed(["GET"]);
export const POST = rejectUnsupportedMethod;
export const PUT = rejectUnsupportedMethod;
export const PATCH = rejectUnsupportedMethod;
export const DELETE = rejectUnsupportedMethod;
