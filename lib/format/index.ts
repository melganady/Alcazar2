export function formatNumber(value: number, locale = "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatHandover(quarter: string, year: number): string {
  return `${quarter} ${year}`;
}

/** "Studio–3 BR" / "1–4 BR" / "Studio" */
export function formatBedrooms(
  min: number,
  max: number,
  studioLabel = "Studio",
): string {
  const label = (n: number) => (n === 0 ? studioLabel : `${n}`);
  if (min === max) return min === 0 ? studioLabel : `${min} BR`;
  return `${label(min)}–${label(max)} BR`;
}

/** "60/40" from during-construction and on-handover percentages. */
export function formatPaymentPlanLabel(
  duringPct: number,
  handoverPct: number,
  postHandoverPct?: number,
): string {
  if (postHandoverPct) {
    return `${duringPct}/${handoverPct}/${postHandoverPct} post-handover`;
  }
  return `${duringPct}/${handoverPct}`;
}
