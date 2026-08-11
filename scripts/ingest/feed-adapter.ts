/**
 * TRACK B — licensed listings feed adapter. INTERFACE ONLY, per §5.
 *
 * If Alcázar buys a licensed broker feed (Property Finder, Bayut, Reelly or
 * similar), it arrives with a contractual right to display — which is what
 * separates it from scraping. Implement this interface against whichever feed
 * is signed; the import path and the publish gate stay unchanged.
 *
 * No implementation is shipped because no feed is licensed yet. Wiring one in
 * before the contract exists would recreate exactly the problem §5 avoids.
 */
import type { Project } from "../../payload-types";

export type FeedListing = {
  externalId: string;
  name: string;
  subCommunity: string;
  community?: string;
  region?: string;
  developerName?: string;
  propertyTypes?: string[];
  bedroomsMin?: number;
  bedroomsMax?: number;
  priceFromAED?: number;
  sizeFromSqft?: number;
  paymentPlanLabel?: string;
  handoverQuarter?: string;
  handoverYear?: number;
  /** Media URLs are only usable when the licence covers display. */
  media?: { heroUrl?: string; galleryUrls?: string[] };
  /** The licence under which this listing may be displayed. Required. */
  licence: { provider: string; contractRef: string; permitsDisplay: boolean };
};

export interface FeedAdapter {
  name: string;
  /** Pull the current page of listings. Pagination is adapter-specific. */
  fetchPage(cursor?: string): Promise<{ listings: FeedListing[]; nextCursor?: string }>;
}

export type FeedImportResult = {
  imported: number;
  rejected: Array<{ externalId: string; reason: string }>;
};

/**
 * Shared guard every feed implementation must pass through: a listing with no
 * display right never becomes a Project, and everything still lands as a draft
 * for the Trakheesi permit and our verdict.
 */
export function toDraftProject(listing: FeedListing): Partial<Project> | { rejected: string } {
  if (!listing.licence?.permitsDisplay) {
    return { rejected: "licence does not permit display" };
  }
  if (!listing.name || !listing.subCommunity) {
    return { rejected: "missing name or sub-community" };
  }
  return {
    name: listing.name,
    subCommunity: listing.subCommunity,
    priceFromAED: listing.priceFromAED,
    sizeFromSqft: listing.sizeFromSqft,
    bedroomsMin: listing.bedroomsMin,
    bedroomsMax: listing.bedroomsMax,
    handoverYear: listing.handoverYear,
    mediaLicence: "developer-supplied",
    mediaLicenceNote: `Licensed feed: ${listing.licence.provider}, contract ${listing.licence.contractRef}`,
    alcazarStatus: "monitoring",
    // publishedAt intentionally absent — the §5 gate still applies.
  };
}
