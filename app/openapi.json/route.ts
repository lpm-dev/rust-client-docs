import { openApiDocument } from "@/lib/openapi";

export const revalidate = false;

export function GET() {
  return Response.json(openApiDocument, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
