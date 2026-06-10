import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/shared";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /og/ stays crawlable — JSON-LD image fields point there.
        disallow: ["/api/", "/a/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
