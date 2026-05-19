import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/shared";
import { source } from "@/lib/source";

// Set BUILD_TIME in CI (e.g. `export BUILD_TIME=$(date -u +%FT%TZ)`) for a
// per-deploy timestamp. Without it, fall back to process start, which is
// stable within the process lifetime — better than `new Date()` per call
// (which crawlers read as "everything changed today" and erodes trust).
const BUILD_TIME = process.env.BUILD_TIME
  ? new Date(process.env.BUILD_TIME)
  : new Date();

const GET_STARTED_PREFIXES = [
  "/docs/installation",
  "/docs/first-install",
  "/docs/project-setup",
  "/docs/migrating",
  "/docs/registries",
  "/docs/commands",
];

function priorityFor(url: string): number {
  if (GET_STARTED_PREFIXES.some((p) => url === p || url.startsWith(`${p}/`))) {
    return 0.9;
  }
  const segments = url.replace(/^\//, "").split("/").filter(Boolean);
  if (segments.length <= 2) return 0.8;
  return 0.7;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const homeRoute: MetadataRoute.Sitemap[number] = {
    url: `${siteUrl}/`,
    lastModified: BUILD_TIME,
    changeFrequency: "weekly",
    priority: 1,
  };

  const docRoutes: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: `${siteUrl}${page.url}`,
    lastModified: BUILD_TIME,
    changeFrequency: "weekly" as const,
    priority: priorityFor(page.url),
  }));

  return [homeRoute, ...docRoutes];
}
