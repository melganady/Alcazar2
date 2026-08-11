import { createHash } from "crypto";

/**
 * Fact extraction for Track A (§5). Deliberately narrow: this module can only
 * produce the thin identifier fields the brief permits. There is no code path
 * here that captures description prose, images, floor plans or brochures.
 */

export type UniverseFact = {
  fingerprint: string;
  projectName: string;
  developerName?: string;
  community?: string;
  region?: string;
  handover?: string;
  paymentPlanLabel?: string;
  priceFromAED?: number;
  propertyTypes?: string[];
  bedroomsRange?: string;
  sourceUrl: string;
  sourceHost: string;
};

/** Stable identity across runs so weekly diffs mean something. */
export function fingerprint(projectName: string, community: string | undefined, host: string): string {
  return createHash("sha1")
    .update(`${host}|${projectName.toLowerCase().trim()}|${(community ?? "").toLowerCase().trim()}`)
    .digest("hex")
    .slice(0, 16);
}

const EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Ras Al Khaimah",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Fujairah",
];

export function parseEmirate(text: string): string | undefined {
  return EMIRATES.find((e) => text.toLowerCase().includes(e.toLowerCase()));
}

/**
 * "AED 1,600,000" / "1.6M" → 1600000.
 * Matches a price *pattern* inside surrounding text — it must never sweep up
 * unrelated digits (bedroom counts, payment-plan splits, handover years).
 */
export function parsePriceAED(text: string): number | undefined {
  const currencyTagged =
    text.match(/AED\s*([\d,]{6,})/i) ?? text.match(/([\d,]{6,})\s*AED/i);
  if (currencyTagged) {
    const n = Number(currencyTagged[1].replace(/,/g, ""));
    if (!Number.isNaN(n)) return n;
  }

  const grouped = text.match(/\b(\d{1,3}(?:,\d{3}){2,})\b/);
  if (grouped) {
    const n = Number(grouped[1].replace(/,/g, ""));
    if (!Number.isNaN(n)) return n;
  }

  const millions = text.match(/\b(\d+(?:\.\d+)?)\s*M\b/i);
  if (millions) {
    const n = Number(millions[1]);
    if (!Number.isNaN(n)) return Math.round(n * 1_000_000);
  }

  return undefined;
}

/** "60/40", "80/20", "50/50 post handover" */
export function parsePaymentPlan(text: string): string | undefined {
  const m = text.match(/\b(\d{1,3})\s*\/\s*(\d{1,3})(?:\s*\/\s*(\d{1,3}))?\b/);
  if (!m) return undefined;
  const parts = [m[1], m[2], m[3]].filter(Boolean);
  const label = parts.join("/");
  return /post[- ]?handover/i.test(text) ? `${label} post-handover` : label;
}

/** "Q4 2027" */
export function parseHandover(text: string): string | undefined {
  const m = text.match(/\bQ([1-4])\s*[-/ ]?\s*(20\d{2})\b/i);
  return m ? `Q${m[1]} ${m[2]}` : undefined;
}

/** "1-3 Bedrooms", "Studio - 2 BR" */
export function parseBedrooms(text: string): string | undefined {
  const m = text.match(/\b(studio|\d)\s*(?:-|–|to)\s*(\d)\s*(?:bed|br\b)/i);
  if (m) return `${m[1]}–${m[2]} BR`;
  const single = text.match(/\b(\d)\s*(?:bed|br\b)/i);
  return single ? `${single[1]} BR` : undefined;
}

const TYPES = [
  "Apartment",
  "Penthouse",
  "Townhouse",
  "Villa",
  "Sky Villa",
  "Duplex",
  "Mansion",
  "Hotel Room",
  "Office",
];

export function parsePropertyTypes(text: string): string[] {
  const found = TYPES.filter((t) => new RegExp(`\\b${t}s?\\b`, "i").test(text));
  return found.length > 0 ? found : [];
}

/**
 * Strips a card's text to the permitted facts. Anything not matched by a
 * parser above is discarded — prose never survives this function.
 */
export function factsFromCardText(
  cardText: string,
  { projectName, community, developerName, sourceUrl }: {
    projectName: string;
    community?: string;
    developerName?: string;
    sourceUrl: string;
  },
): UniverseFact {
  const host = new URL(sourceUrl).host;
  return {
    fingerprint: fingerprint(projectName, community, host),
    projectName,
    developerName,
    community,
    region: parseEmirate(cardText),
    handover: parseHandover(cardText),
    paymentPlanLabel: parsePaymentPlan(cardText),
    priceFromAED: parsePriceAED(cardText),
    propertyTypes: parsePropertyTypes(cardText),
    bedroomsRange: parseBedrooms(cardText),
    sourceUrl,
    sourceHost: host,
  };
}
