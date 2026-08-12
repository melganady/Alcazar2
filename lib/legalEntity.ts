import { getPayloadClient } from "./payload";
import { hasLapsed } from "./credentials";

export { brokerNumber } from "./credentials";

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
  /** True when the trade licence on file has lapsed. */
  licenceExpired: boolean;
  licenceExpiry?: string;
};

export async function getComplianceIdentity(): Promise<ComplianceIdentity> {
  const payload = await getPayloadClient();
  const e = await payload.findGlobal({ slug: "legal-entity" });

  const brandName = e?.brandName || "Alcázar";
  const hidden = e?.displayMode === "brand-only";

  // A lapsed licence is never published: putting an expired number on a live
  // property advert misrepresents the brokerage's standing, which is worse
  // than showing nothing.
  const expiry = e?.tradeLicenceExpiry ? new Date(e.tradeLicenceExpiry) : null;
  const licenceExpired = hasLapsed(expiry);

  const registrations = [
    e?.orn ? `ORN ${e.orn}` : "ORN pending",
    e?.tradeLicence && !licenceExpired
      ? `Trade licence ${e.tradeLicence}`
      : "Trade licence pending",
    e?.dldBrokerRegistration && !licenceExpired ? `DLD ${e.dldBrokerRegistration}` : null,
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
    licenceExpired,
    licenceExpiry: expiry ? expiry.toISOString().slice(0, 10) : undefined,
  };
}
