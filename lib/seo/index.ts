import type { Agent, Community, Developer, Project } from "@/payload-types";
import { SITE } from "@/lib/site";

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rein-international.com";

export function absolute(path: string): string {
  return new URL(path, BASE_URL).toString();
}

/** hreflang pairs for en/ar (§10). localePrefix is "as-needed": en has no prefix. */
export function alternates(path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return {
    canonical: absolute(clean),
    languages: {
      en: absolute(clean),
      ar: absolute(`/ar${clean === "/" ? "" : clean}`),
      "x-default": absolute(clean),
    },
  };
}

/** §10 title pattern for project pages. */
/**
 * Feed plan labels are prose, and many already contain "payment plan" —
 * "60/40" needs the suffix, "4 Years Post Handover Payment Plan" does not.
 * Returns null when there is no label, so callers can drop the clause.
 */
export function planPhrase(
  label: string | null | undefined,
  suffix: "Payment Plan" | "payment plan",
): string | null {
  const trimmed = label?.trim();
  if (!trimmed) return null;
  return /payment plan/i.test(trimmed) ? trimmed : `${trimmed} ${suffix}`;
}

export function projectTitle(project: Project): string {
  const plan = planPhrase(project.paymentPlan?.label, "Payment Plan") ?? "";
  const handover = project.handoverQuarter && project.handoverYear
    ? `, Handover ${project.handoverQuarter} ${project.handoverYear}`
    : "";
  return `${project.name}, ${project.subCommunity}${plan ? ` — ${plan.replace(/, $/, "")}` : ""}${handover}`;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${BASE_URL}/#organization`,
    name: SITE.name,
    legalName: SITE.compliance.legalName,
    url: BASE_URL,
    slogan: "Fresh thinking, real income.",
    areaServed: { "@type": "Country", name: "United Arab Emirates" },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressCountry: "AE",
    },
    knowsLanguage: ["en", "ar"],
  };
}

export function breadcrumbJsonLd(trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: absolute(t.path),
    })),
  };
}

/** §10 — RealEstateListing with offers, floorSize, numberOfRooms, geo. */
export function projectJsonLd(project: Project) {
  const developer =
    project.developer && typeof project.developer === "object"
      ? (project.developer as Developer)
      : null;
  const community =
    project.community && typeof project.community === "object"
      ? (project.community as Community)
      : null;

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: `${project.name}, ${project.subCommunity}`,
    url: absolute(`/projects/${project.slug}`),
    datePosted: project.publishedAt ?? undefined,
    provider: { "@id": `${BASE_URL}/#organization` },
    offers: {
      "@type": "Offer",
      price: project.priceFromAED,
      priceCurrency: "AED",
      availability:
        project.status === "sold-out"
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      seller: developer ? { "@type": "Organization", name: developer.name } : undefined,
    },
    floorSize: project.sizeFromSqft
      ? { "@type": "QuantitativeValue", value: project.sizeFromSqft, unitCode: "FTK" }
      : undefined,
    numberOfRooms: {
      "@type": "QuantitativeValue",
      minValue: project.bedroomsMin,
      maxValue: project.bedroomsMax,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: project.subCommunity,
      addressRegion: project.region,
      addressCountry: "AE",
    },
    geo:
      community?.lat != null && community?.lng != null
        ? { "@type": "GeoCoordinates", latitude: community.lat, longitude: community.lng }
        : undefined,
  };
}

export function agentJsonLd(agent: Agent) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: agent.name,
    jobTitle: agent.role,
    identifier: `RERA BRN ${agent.brn}`,
    knowsLanguage: agent.languages ?? undefined,
    worksFor: { "@id": `${BASE_URL}/#organization` },
  };
}

/**
 * §10 — filtered views below a results threshold are noindex to avoid thin
 * content, and any view with more than one active facet is noindex regardless.
 * The ~40 highest-value single-facet combinations stay indexable.
 */
export const INDEXABLE_FACETS = ["emirate", "community", "developer", "type", "beds", "handover"];
export const MIN_INDEXABLE_RESULTS = 3;

export function shouldIndexFilteredView(
  activeFacets: string[],
  resultCount: number,
): boolean {
  if (activeFacets.length === 0) return true;
  if (activeFacets.length > 1) return false;
  if (!INDEXABLE_FACETS.includes(activeFacets[0])) return false;
  return resultCount >= MIN_INDEXABLE_RESULTS;
}
