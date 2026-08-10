/*
 * Indicative deposit figures for project pages, pending Phase 4's full
 * CMS-backed constants (§8). Every rendered use must carry the effective
 * date and the "indicative only" note — §11.10.
 */
export const INDICATIVE_LTV = {
  effectiveFrom: "2026-07-01",
  sourceNote:
    "Indicative, based on CBUAE ceilings as commonly applied by UAE banks. Lender criteria vary; verify before relying on this.",
  residentFirstPropertyPct: 80, // <= AED 5M
  residentOver5MPct: 70,
  nonResidentPct: 60, // lender-dependent 50–60
  offPlanDuringConstructionPct: 50,
} as const;

export function depositFor(priceAED: number, ltvPct: number): number {
  return Math.round(priceAED * (1 - ltvPct / 100));
}
