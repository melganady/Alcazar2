import type { MetadataRoute } from "next";
import { getPayloadClient } from "@/lib/payload";
import { baseWhere } from "@/lib/projects";
import { getCommunities, getDevelopers } from "@/lib/directory";
import { staticParamsOrEmpty } from "@/lib/buildTime";
import { absolute } from "@/lib/seo";

/** §10 — sitemaps split by type, regenerated on publish via ISR. */
export async function generateSitemaps() {
  return [{ id: "pages" }, { id: "projects" }, { id: "developers" }, { id: "communities" }, { id: "articles" }];
}

const withAlternates = (path: string, lastModified?: string | Date) => ({
  url: absolute(path),
  lastModified: lastModified ? new Date(lastModified) : undefined,
  alternates: {
    languages: {
      en: absolute(path),
      ar: absolute(`/ar${path === "/" ? "" : path}`),
    },
  },
});

export default async function sitemap({
  id,
}: {
  id: string;
}): Promise<MetadataRoute.Sitemap> {
  if (id === "projects") {
    return staticParamsOrEmpty("sitemap:projects", async () => {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "projects",
      where: { and: baseWhere() },
      limit: 1000,
      depth: 0,
      select: { slug: true, updatedAt: true },
    });
    return res.docs.map((p) => withAlternates(`/projects/${p.slug}`, p.updatedAt));
    });
  }

  // Directory queries rather than the raw collections: a developer or area
  // with nothing publishable has no page worth crawling, and the feed carries
  // hundreds of names we hold only as a relationship target.
  if (id === "developers") {
    return staticParamsOrEmpty("sitemap:developers", async () =>
      (await getDevelopers()).map((d) => withAlternates(`/developers/${d.slug}`)),
    );
  }

  if (id === "communities") {
    return staticParamsOrEmpty("sitemap:communities", async () =>
      (await getCommunities()).map((c) => withAlternates(`/communities/${c.slug}`)),
    );
  }

  if (id === "articles") {
    return staticParamsOrEmpty("sitemap:articles", async () => {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "articles",
      where: { publishedAt: { exists: true } },
      limit: 500,
      depth: 0,
      select: { slug: true, updatedAt: true },
    });
    return res.docs.map((a) => withAlternates(`/insights/${a.slug}`, a.updatedAt));
    });
  }

  return [
    "/",
    "/projects",
    "/secondary",
    "/developers",
    "/communities",
    "/mortgages",
    "/mortgages/calculator",
    "/mortgages/non-residents",
    "/mortgages/off-plan",
    "/how-we-work",
    "/about",
    "/team",
    "/careers",
    "/insights",
    "/contact",
    "/legal/privacy",
    "/legal/terms",
    "/legal/disclaimer",
    "/legal/cookies",
  ].map((p) => withAlternates(p));
}
