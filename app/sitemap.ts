import type { MetadataRoute } from "next";
import { getPayloadClient } from "@/lib/payload";
import { baseWhere } from "@/lib/projects";
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
  const payload = await getPayloadClient();

  if (id === "projects") {
    const res = await payload.find({
      collection: "projects",
      where: { and: baseWhere() },
      limit: 1000,
      depth: 0,
      select: { slug: true, updatedAt: true },
    });
    return res.docs.map((p) => withAlternates(`/projects/${p.slug}`, p.updatedAt));
  }

  if (id === "developers") {
    const res = await payload.find({
      collection: "developers",
      limit: 500,
      depth: 0,
      select: { slug: true, updatedAt: true },
    });
    return res.docs.map((d) => withAlternates(`/developers/${d.slug}`, d.updatedAt));
  }

  if (id === "communities") {
    const res = await payload.find({
      collection: "communities",
      limit: 500,
      depth: 0,
      select: { slug: true, updatedAt: true },
    });
    return res.docs.map((c) => withAlternates(`/communities/${c.slug}`, c.updatedAt));
  }

  if (id === "articles") {
    const res = await payload.find({
      collection: "articles",
      where: { publishedAt: { exists: true } },
      limit: 500,
      depth: 0,
      select: { slug: true, updatedAt: true },
    });
    return res.docs.map((a) => withAlternates(`/insights/${a.slug}`, a.updatedAt));
  }

  return [
    "/",
    "/projects",
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
