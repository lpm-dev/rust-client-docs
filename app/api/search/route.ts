import { createFromSource } from "fumadocs-core/search/server";
import { apiProblem, methodNotAllowed } from "@/lib/api-problem";
import { source } from "@/lib/source";

const searchApi = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: "english",
});

export async function GET(request: Request) {
  try {
    return await searchApi.GET(request);
  } catch {
    console.error("[docs-search] Search failed");
    return apiProblem(request, {
      status: 500,
      code: "SEARCH_FAILED",
      title: "Documentation search failed",
      message: "The LPM CLI documentation search did not complete.",
      resolution: "Retry the request. If it fails again, use /llms.txt.",
    });
  }
}

const rejectUnsupportedMethod = methodNotAllowed(["GET"]);
export const POST = rejectUnsupportedMethod;
export const PUT = rejectUnsupportedMethod;
export const PATCH = rejectUnsupportedMethod;
export const DELETE = rejectUnsupportedMethod;
