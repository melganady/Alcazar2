import type { Where } from "payload";
import { getPayloadClient } from "./payload";
import type { Project } from "@/payload-types";

export const PAGE_SIZE = 24;

export type ProjectFilters = {
  emirate?: string;
  community?: string; // slug
  developer?: string; // slug
  type?: string;
  beds?: string; // "0".."4" (4 = 4+)
  priceMin?: string; // AED
  priceMax?: string; // AED
  handover?: string; // year
  postHandover?: string; // "1"
  status?: string;
  mortgageable?: string;
  goldenVisa?: string; // "1"
  shortlisted?: string; // "1"
  sort?: string;
  page?: string;
  view?: string;
};

const SORTS: Record<string, string> = {
  relevance: "editorialOrder",
  "price-asc": "priceFromAED",
  "price-desc": "-priceFromAED",
  handover: "handoverYear",
  newest: "-publishedAt",
};

/** Base visibility: published, not declined, fixtures excluded in production builds when flagged. */
export function baseWhere(): Where[] {
  const and: Where[] = [
    { publishedAt: { exists: true } },
    { alcazarStatus: { not_equals: "declined" } },
  ];
  if (process.env.EXCLUDE_FIXTURES === "true") {
    and.push({ isFixture: { not_equals: true } });
  }
  return and;
}

export async function queryProjects(filters: ProjectFilters) {
  const payload = await getPayloadClient();
  const and: Where[] = baseWhere();

  if (filters.emirate) and.push({ emirate: { equals: filters.emirate } });

  if (filters.community) {
    const c = await payload.find({
      collection: "communities",
      where: { slug: { equals: filters.community } },
      limit: 1,
    });
    if (c.docs[0]) and.push({ community: { equals: c.docs[0].id } });
  }

  if (filters.developer) {
    const d = await payload.find({
      collection: "developers",
      where: { slug: { equals: filters.developer } },
      limit: 1,
    });
    if (d.docs[0]) and.push({ developer: { equals: d.docs[0].id } });
  }

  if (filters.type) and.push({ propertyTypes: { contains: filters.type } });

  if (filters.beds) {
    const beds = Number(filters.beds);
    if (beds >= 4) {
      and.push({ bedroomsMax: { greater_than_equal: 4 } });
    } else {
      and.push({ bedroomsMin: { less_than_equal: beds } });
      and.push({ bedroomsMax: { greater_than_equal: beds } });
    }
  }

  if (filters.priceMin) and.push({ priceFromAED: { greater_than_equal: Number(filters.priceMin) } });
  if (filters.priceMax) and.push({ priceFromAED: { less_than_equal: Number(filters.priceMax) } });
  if (filters.handover) and.push({ handoverYear: { equals: Number(filters.handover) } });
  if (filters.postHandover === "1") {
    and.push({ "paymentPlan.postHandoverPct": { greater_than: 0 } });
  }
  if (filters.status) and.push({ status: { equals: filters.status } });
  if (filters.mortgageable) and.push({ mortgageable: { equals: filters.mortgageable } });
  if (filters.goldenVisa === "1") and.push({ goldenVisaEligible: { equals: true } });
  if (filters.shortlisted === "1") and.push({ alcazarStatus: { equals: "shortlisted" } });

  const page = Math.max(1, Number(filters.page) || 1);
  const sort = SORTS[filters.sort ?? "relevance"] ?? SORTS.relevance;

  return payload.find({
    collection: "projects",
    where: { and },
    sort,
    limit: PAGE_SIZE,
    page,
    depth: 1,
  });
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "projects",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  });
  return res.docs[0] ?? null;
}

export async function getAllProjectSlugs(): Promise<string[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "projects",
    where: { and: [{ publishedAt: { exists: true } }] },
    limit: 500,
    depth: 0,
    select: { slug: true },
  });
  return res.docs.map((d) => d.slug);
}

/** 3 similar: same community first, then same handover year (§6). */
export async function getSimilarProjects(project: Project): Promise<Project[]> {
  const payload = await getPayloadClient();
  const communityId =
    typeof project.community === "object" ? project.community?.id : project.community;
  const res = await payload.find({
    collection: "projects",
    where: {
      and: [
        ...baseWhere(),
        { id: { not_equals: project.id } },
        {
          or: [
            ...(communityId ? [{ community: { equals: communityId } }] : []),
            { handoverYear: { equals: project.handoverYear } },
          ],
        },
      ],
    },
    limit: 3,
    depth: 1,
  });
  return res.docs;
}

/** Other projects completing in the same community within ±1 year — supply in window (§6). */
export async function getSupplyInWindow(project: Project): Promise<Project[]> {
  const payload = await getPayloadClient();
  const communityId =
    typeof project.community === "object" ? project.community?.id : project.community;
  if (!communityId || !project.handoverYear) return [];
  const res = await payload.find({
    collection: "projects",
    where: {
      and: [
        ...baseWhere(),
        { id: { not_equals: project.id } },
        { community: { equals: communityId } },
        { handoverYear: { greater_than_equal: project.handoverYear - 1 } },
        { handoverYear: { less_than_equal: project.handoverYear + 1 } },
      ],
    },
    limit: 6,
    depth: 0,
  });
  return res.docs;
}

export async function getFilterOptions() {
  const payload = await getPayloadClient();
  const [communities, developers] = await Promise.all([
    payload.find({ collection: "communities", limit: 200, depth: 0, sort: "name" }),
    payload.find({ collection: "developers", limit: 200, depth: 0, sort: "name" }),
  ]);
  return {
    communities: communities.docs.map((c) => ({
      slug: c.slug,
      name: c.name,
      emirate: c.emirate,
    })),
    developers: developers.docs.map((d) => ({ slug: d.slug, name: d.name })),
  };
}

export async function getProjectsBySlugs(slugs: string[]): Promise<Project[]> {
  if (slugs.length === 0) return [];
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "projects",
    where: { slug: { in: slugs } },
    limit: 3,
    depth: 1,
  });
  // preserve requested order
  return slugs
    .map((s) => res.docs.find((d) => d.slug === s))
    .filter((d): d is Project => Boolean(d));
}
