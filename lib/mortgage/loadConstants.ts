import { getPayloadClient } from "@/lib/payload";
import { DEFAULT_MORTGAGE_CONSTANTS } from "./defaults";
import type { MortgageConstants } from "./types";

/** CMS is the runtime source; defaults only bridge an unseeded database. */
export async function loadMortgageConstants(): Promise<MortgageConstants> {
  const payload = await getPayloadClient();
  const doc = await payload.findGlobal({ slug: "mortgage-constants" });
  if (!doc?.effectiveFrom) return DEFAULT_MORTGAGE_CONSTANTS;
  const d = DEFAULT_MORTGAGE_CONSTANTS;
  return {
    effectiveFrom: doc.effectiveFrom.slice(0, 10),
    sourceNote: doc.sourceNote ?? d.sourceNote,
    ltv: { ...d.ltv, ...(doc.ltv ?? {}) } as MortgageConstants["ltv"],
    dbr: { ...d.dbr, ...(doc.dbr ?? {}) } as MortgageConstants["dbr"],
    tenure: { ...d.tenure, ...(doc.tenure ?? {}) } as MortgageConstants["tenure"],
    fees: { ...d.fees, ...(doc.fees ?? {}) } as MortgageConstants["fees"],
  };
}
