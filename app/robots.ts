import type { MetadataRoute } from "next";
import { absolute } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin, API and the compare scratch view carry nothing worth indexing.
        disallow: ["/admin", "/api/", "/projects/compare"],
      },
    ],
    sitemap: [
      absolute("/sitemap/pages.xml"),
      absolute("/sitemap/projects.xml"),
      absolute("/sitemap/developers.xml"),
      absolute("/sitemap/communities.xml"),
      absolute("/sitemap/articles.xml"),
    ],
    host: absolute("/"),
  };
}
