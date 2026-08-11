import { getPayloadClient } from "./payload";
import { baseWhere } from "./projects";
import type { Community, Developer, Project } from "@/payload-types";

/**
 * Directory queries for the developer and community pages.
 *
 * Counts and price floors are computed from publishable projects only, so a
 * directory page can never imply we are advertising something that has not
 * cleared the publish gate.
 */

export type DirectoryEntry = {
  slug: string;
  name: string;
  subtitle?: string;
  projectCount: number;
  priceFromAED?: number;
  image?: string | null;
  imageAlt?: string;
};

async function projectsFor(
  key: "developer" | "community",
  id: number,
  limit = 100,
): Promise<Project[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "projects",
    where: { and: [...baseWhere(), { [key]: { equals: id } }] },
    sort: "priceFromAED",
    limit,
    depth: 1,
  });
  return res.docs;
}

/**
 * Lowest genuine entry price. Feed records without a price import as 0, and
 * sorting ascending would otherwise put those first and hide the real floor.
 */
const priceFloor = (projects: Project[]): number | undefined => {
  const priced = projects.map((p) => p.priceFromAED).filter((v) => typeof v === "number" && v > 0);
  return priced.length > 0 ? Math.min(...priced) : undefined;
};

/** First project that actually has a render, so directory cards show a photo. */
const firstWithHero = (projects: Project[]): Project | undefined =>
  projects.find((p) => p.media?.hero && typeof p.media.hero === "object") ?? projects[0];

const heroOf = (p?: Project) =>
  p?.media?.hero && typeof p.media.hero === "object"
    ? { url: p.media.hero.url ?? null, alt: p.media.hero.alt ?? undefined }
    : { url: null, alt: undefined };

export async function getDevelopers(): Promise<DirectoryEntry[]> {
  const payload = await getPayloadClient();
  const devs = await payload.find({ collection: "developers", limit: 300, sort: "name", depth: 0 });

  const entries = await Promise.all(
    devs.docs.map(async (d) => {
      const projects = await projectsFor("developer", d.id, 100);
      const hero = heroOf(firstWithHero(projects));
      return {
        slug: d.slug,
        name: d.name,
        subtitle: [
          d.headquarters,
          d.projectsDelivered != null ? `${d.projectsDelivered} delivered` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        projectCount: projects.length,
        priceFromAED: priceFloor(projects),
        image: hero.url,
        imageAlt: hero.alt,
      };
    }),
  );
  // A developer with nothing publishable is not a directory entry.
  return entries.filter((e) => e.projectCount > 0).sort((a, b) => b.projectCount - a.projectCount);
}

export async function getCommunities(): Promise<DirectoryEntry[]> {
  const payload = await getPayloadClient();
  const communities = await payload.find({
    collection: "communities",
    limit: 300,
    sort: "name",
    depth: 0,
  });

  const entries = await Promise.all(
    communities.docs.map(async (c) => {
      const projects = await projectsFor("community", c.id, 100);
      const hero = heroOf(firstWithHero(projects));
      return {
        slug: c.slug,
        name: c.name,
        subtitle: c.region,
        projectCount: projects.length,
        priceFromAED: priceFloor(projects),
        image: hero.url,
        imageAlt: hero.alt,
      };
    }),
  );
  return entries.filter((e) => e.projectCount > 0).sort((a, b) => b.projectCount - a.projectCount);
}

export async function getDeveloperBySlug(
  slug: string,
): Promise<{ developer: Developer; projects: Project[] } | null> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "developers",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  const developer = res.docs[0];
  if (!developer) return null;
  return { developer, projects: await projectsFor("developer", developer.id) };
}

export async function getCommunityBySlug(
  slug: string,
): Promise<{ community: Community; projects: Project[] } | null> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "communities",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  const community = res.docs[0];
  if (!community) return null;
  return { community, projects: await projectsFor("community", community.id) };
}
