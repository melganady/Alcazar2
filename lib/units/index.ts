export type AreaUnit = "sqft" | "sqm";

const SQFT_PER_SQM = 10.7639;

export function sqftToSqm(sqft: number): number {
  return sqft / SQFT_PER_SQM;
}

export function formatArea(
  sqft: number,
  unit: AreaUnit,
  locale = "en",
): string {
  const value = unit === "sqft" ? sqft : sqftToSqm(sqft);
  const formatted = new Intl.NumberFormat(
    locale === "ar" ? "ar-AE" : "en-AE",
    { maximumFractionDigits: 0 },
  ).format(value);
  const suffix = unit === "sqft" ? "sqft" : "sqm";
  return `${formatted} ${suffix}`;
}
