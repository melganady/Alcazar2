import type { MetadataRoute } from "next";
import { absolute } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Admin, the CRM, API and the compare scratch view carry nothing
        // worth indexing — /crm is also gated by auth and a per-page noindex.
        disallow: ["/admin", "/crm", "/api/", "/projects/compare"],
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
