import { getPayloadClient } from "./payload";

/**
 * The compliance strip shown in the footer and on every advert (§11.3).
 *
 * Kept out of components so there is exactly one place that decides how the
 * licence holder is identified, and one place to change it when the licence
 * position changes.
 */
export type ComplianceIdentity = {
  brandName: string;
  /** The line naming the licence holder, or null when displayMode hides it. */
  licenceLine: string | null;
  /** ORN / trade licence / DLD registration, in display order. */
  registrations: string[];
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  /** True when licence numbers are published without naming the holder. */
  entityNameHidden: boolean;
};

export async function getComplianceIdentity(): Promise<ComplianceIdentity> {
  const payload = await getPayloadClient();
  const e = await payload.findGlobal({ slug: "legal-entity" });

  const brandName = e?.brandName || "Alcázar";
  const hidden = e?.displayMode === "brand-only";

  const registrations = [
    e?.orn ? `ORN ${e.orn}` : "ORN pending",
    e?.tradeLicence ? `Trade licence ${e.tradeLicence}` : "Trade licence pending",
    e?.dldBrokerRegistration ? `DLD ${e.dldBrokerRegistration}` : null,
  ].filter((v): v is string => Boolean(v));

  return {
    brandName,
    licenceLine:
      hidden || !e?.licensedEntityName
        ? null
        : e.licensedEntityName === brandName
          ? e.licensedEntityName
          : `${brandName}, a trading name of ${e.licensedEntityName}`,
    registrations,
    address: e?.address ?? undefined,
    city: e?.city ?? "Dubai, United Arab Emirates",
    phone: e?.phone ?? undefined,
    email: e?.email ?? undefined,
    entityNameHidden: hidden,
  };
}
