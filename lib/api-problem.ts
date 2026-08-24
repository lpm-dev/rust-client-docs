import { developerResourcesRoute, openApiRoute, siteUrl } from "./shared";

type ApiProblemOptions = {
  status: number;
  code: string;
  title: string;
  message: string;
  resolution: string;
  type?: string;
  extensions?: Record<string, unknown>;
  headers?: HeadersInit;
};

/** Returns an RFC 9457 Problem Details response with agent recovery fields. */
export function apiProblem(
  request: Request,
  options: ApiProblemOptions,
): Response {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/problem+json; charset=utf-8");

  return new Response(
    JSON.stringify({
      ...options.extensions,
      type: options.type ?? "about:blank",
      title: options.title,
      status: options.status,
      detail: options.message,
      instance: new URL(request.url).pathname,
      code: options.code,
      message: options.message,
      resolution: options.resolution,
      documentation_url: `${siteUrl}${developerResourcesRoute}`,
    }),
    { status: options.status, headers },
  );
}

export function apiRouteNotFound(request: Request): Response {
  return apiProblem(request, {
    status: 404,
    code: "API_ROUTE_NOT_FOUND",
    title: "API route not found",
    message: `No API route exists at ${new URL(request.url).pathname}.`,
    resolution: `Read ${siteUrl}${openApiRoute} and use a documented path.`,
  });
}

export function methodNotAllowed(allowed: string[]) {
  return function handleMethodNotAllowed(request: Request): Response {
    return apiProblem(request, {
      status: 405,
      code: "METHOD_NOT_ALLOWED",
      title: "Method not allowed",
      message: `${request.method} is not supported for this API route.`,
      resolution: `Use one of these methods: ${allowed.join(", ")}.`,
      headers: { Allow: allowed.join(", ") },
    });
  };
}
