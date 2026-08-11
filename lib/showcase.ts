import { getPayloadClient } from "./payload";
import { baseWhere } from "./projects";
import { formatHandoverOrDash } from "./format";
import type { Slide } from "@/components/sections/ProjectSlider";

/**
 * Imagery and slides for pages other than the project pages.
 *
 * Only ever draws from published projects with a recorded media licence, so
 * a picture can never reach the site ahead of the right to show it.
 */
const licensed = () => [...baseWhere(), { mediaLicence: { not_equals: "unlicensed" } }];

export async function getSlides(limit = 6): Promise<Slide[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "projects",
    where: { and: [...licensed(), { "media.hero": { exists: true } }] },
    sort: "-priceFromAED",
    limit,
    depth: 1,
  });

  return res.docs.map((p) => ({
    slug: p.slug,
    name: p.name,
    subCommunity: p.subCommunity,
    region: p.region,
    priceFromAED: p.priceFromAED,
    priceLabel: `AED ${p.priceFromAED.toLocaleString("en-AE")}`,
    planLabel: p.paymentPlan?.label || "—",
    handover: formatHandoverOrDash(p.handoverQuarter, p.handoverYear),
    developer:
      p.developer && typeof p.developer === "object" ? p.developer.name : "—",
    image:
      p.media?.hero && typeof p.media.hero === "object" ? p.media.hero.url : null,
    alt:
      p.media?.hero && typeof p.media.hero === "object"
        ? (p.media.hero.alt ?? undefined)
        : undefined,
  }));
}

/** A licensed image for use as a section backdrop or accent panel. */
export async function getShowcaseImages(limit = 4): Promise<
  Array<{ url: string; alt: string; project: string }>
> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "projects",
    where: { and: [...licensed(), { "media.hero": { exists: true } }] },
    sort: "-updatedAt",
    limit,
    depth: 1,
  });
  return res.docs
    .map((p) => {
      const hero = p.media?.hero;
      if (!hero || typeof hero !== "object" || !hero.url) return null;
      return {
        url: hero.url,
        alt: hero.alt ?? `${p.name}, ${p.subCommunity}`,
        project: `${p.name}, ${p.subCommunity}`,
      };
    })
    .filter((x): x is { url: string; alt: string; project: string } => Boolean(x));
}
