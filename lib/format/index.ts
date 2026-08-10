export function formatNumber(value: number, locale = "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatHandover(quarter: string, year: number): string {
  return `${quarter} ${year}`;
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
