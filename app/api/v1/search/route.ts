import {
  handleDocsSearch,
  rejectDocsSearchMethod,
} from "@/lib/docs-search-api";

export const GET = handleDocsSearch;
export const POST = rejectDocsSearchMethod;
export const PUT = rejectDocsSearchMethod;
export const PATCH = rejectDocsSearchMethod;
export const DELETE = rejectDocsSearchMethod;
