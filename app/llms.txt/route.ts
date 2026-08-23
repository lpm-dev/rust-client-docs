import { llms } from "fumadocs-core/source";
import { buildLlmsIndex } from "@/lib/llms-index";
import { markdownResponse } from "@/lib/markdown-response";
import { source } from "@/lib/source";

export const revalidate = false;

export function GET() {
  return markdownResponse(buildLlmsIndex(llms(source).index()));
}
