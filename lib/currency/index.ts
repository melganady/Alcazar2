/*
 * AED is the base and contractual currency: converted figures are always
 * shown alongside it, never instead of it (§9). Rates below are a static
 * development seed — Phase 5 replaces them with a daily cached fetch.
 * Every converted price must render with "converted at [rate], [date]".
 */

export const CURRENCIES = [
  "AED",
  "USD",
  "GBP",
  "EUR",
  "RUB",
  "INR",
  "CNY",
] as const;

export type Currency = (typeof CURRENCIES)[number];

export const RATES_AS_OF = "2026-08-01"; // seed data — not live

// Units of currency per 1 AED
export const RATES_PER_AED: Record<Currency, number> = {
  AED: 1,
  USD: 0.2723, // USD peg 3.6725
  GBP: 0.213,
  EUR: 0.2485,
  RUB: 24.1,
  INR: 23.85,
  CNY: 1.948,
};

const SYMBOLS: Record<Currency, string> = {
  AED: "AED",
  USD: "US$",
  GBP: "£",
  EUR: "€",
  RUB: "₽",
  INR: "₹",
  CNY: "CN¥",
};

export function convertFromAED(amountAED: number, to: Currency): number {
  return amountAED * RATES_PER_AED[to];
}

export function formatAED(amountAED: number, locale = "en"): string {
  return `AED ${new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    maximumFractionDigits: 0,
  }).format(amountAED)}`;
}

/** Secondary display figure, e.g. "≈ US$435,700". Rounds to 3 significant figures. */
export function formatConverted(
  amountAED: number,
  to: Currency,
  locale = "en",
): string | null {
  if (to === "AED") return null;
  const converted = convertFromAED(amountAED, to);
  const rounded = Number(converted.toPrecision(3));
  return `≈ ${SYMBOLS[to]}${new Intl.NumberFormat(
    locale === "ar" ? "ar-AE" : "en-AE",
    { maximumFractionDigits: 0 },
  ).format(rounded)}`;
}

/** Mandatory disclosure line wherever a converted price appears (§9). */
export function conversionNote(to: Currency): string | null {
  if (to === "AED") return null;
  return `Converted at ${RATES_PER_AED[to]} ${to}/AED, ${RATES_AS_OF}`;
}
