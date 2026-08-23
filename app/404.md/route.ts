import { markdownNotFoundResponse } from "@/lib/not-found-response";

export function GET(request: Request) {
  const pathname = new URL(request.url).searchParams.get("path") || "/";
  return markdownNotFoundResponse(pathname);
}
