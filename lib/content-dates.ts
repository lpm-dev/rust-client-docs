import generated from "@/lib/generated/content-dates.json";

type ContentDates = {
  published?: string;
  modified?: string;
};

const contentDates: Record<string, ContentDates> = generated;

/**
 * Git commit dates for a docs page, keyed by its file path under
 * `content/docs` (e.g. `packages/install.mdx`). The map is generated at
 * install/build time by `scripts/generate-content-dates.mjs` and is empty
 * when git history is unavailable, so both fields are optional.
 */
export function contentDatesFor(filePath: string): ContentDates {
  return contentDates[filePath] ?? {};
}
