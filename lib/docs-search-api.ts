import { createFromSource } from "fumadocs-core/search/server";
import { apiProblem, methodNotAllowed } from "./api-problem";
import {
  clientRateLimitPartition,
  createFixedWindowRateLimiter,
  docsSearchRateLimitPolicy,
  rateLimitHeaders,
} from "./rate-limit";
import {
  docsApiDeprecationDocumentationRoute,
  legacyDocsSearchDeprecationDate,
  siteUrl,
} from "./shared";
import { source } from "./source";

const searchApi = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: "english",
});

const searchRateLimiter = createFixedWindowRateLimiter({
  quota: docsSearchRateLimitPolicy.quota,
  windowSeconds: docsSearchRateLimitPolicy.windowSeconds,
});

const deprecationHeaders = {
  Deprecation: legacyDocsSearchDeprecationDate,
  Link: `<${siteUrl}${docsApiDeprecationDocumentationRoute}>; rel="deprecation"; type="text/html"`,
} as const;

function appendHeaders(response: Response, additionalHeaders: HeadersInit) {
  const headers = new Headers(response.headers);
  const additions = new Headers(additionalHeaders);
  additions.forEach((value, name) => {
    headers.set(name, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function handleDocsSearch(request: Request): Promise<Response> {
  const rateLimit = searchRateLimiter.consume(
    clientRateLimitPartition(request),
  );
  const headers = rateLimitHeaders(docsSearchRateLimitPolicy, rateLimit);

  if (!rateLimit.allowed) {
    headers.set("Retry-After", String(rateLimit.resetAfterSeconds));
    return apiProblem(request, {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      title: "Too many requests",
      message: "The documentation search quota is exhausted.",
      resolution: `Wait ${rateLimit.resetAfterSeconds} seconds, then retry the request.`,
      type: "https://iana.org/assignments/http-problem-types#quota-exceeded",
      extensions: { "violated-policies": [docsSearchRateLimitPolicy.name] },
      headers,
    });
  }

  try {
    return appendHeaders(await searchApi.GET(request), headers);
  } catch {
    console.error("[docs-search] Search failed");
    return apiProblem(request, {
      status: 500,
      code: "SEARCH_FAILED",
      title: "Documentation search failed",
      message: "The LPM CLI documentation search did not complete.",
      resolution: "Retry the request. If it fails again, use /llms.txt.",
      headers,
    });
  }
}

const rejectUnsupportedMethod = methodNotAllowed(["GET"]);

export const rejectDocsSearchMethod = rejectUnsupportedMethod;

export function markLegacyDocsSearch(response: Response): Response {
  return appendHeaders(response, deprecationHeaders);
}

export function rejectLegacyDocsSearchMethod(request: Request): Response {
  return markLegacyDocsSearch(rejectUnsupportedMethod(request));
}
