import {
  handleDocsSearch,
  markLegacyDocsSearch,
  rejectLegacyDocsSearchMethod,
} from "@/lib/docs-search-api";

export async function GET(request: Request) {
  return markLegacyDocsSearch(await handleDocsSearch(request));
}

export const POST = rejectLegacyDocsSearchMethod;
export const PUT = rejectLegacyDocsSearchMethod;
export const PATCH = rejectLegacyDocsSearchMethod;
export const DELETE = rejectLegacyDocsSearchMethod;
