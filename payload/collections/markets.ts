/**
 * Multi-market vocabulary (replaces the UAE-only emirate enum).
 *
 * `region` is whatever the country calls its first-level division — emirate in
 * the UAE, governorate in Egypt, province in Thailand, state in the USA. Each
 * country carries the compliance regime that applies to advertising property
 * there, because those rules differ and the publish gate has to respect that.
 */

export type ComplianceRegime = "uae-trakheesi" | "none-configured";

export const COUNTRIES = [
  {
    code: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    regionLabel: "Emirate",
    regions: [
      "Dubai", "Abu Dhabi", "Ras Al Khaimah", "Sharjah", "Ajman", "UAQ", "Fujairah",
    ],
    /** A UAE property advert requires a Trakheesi permit tied to our ORN. */
    compliance: "uae-trakheesi" as ComplianceRegime,
  },
  {
    code: "OM",
    name: "Oman",
    currency: "OMR",
    regionLabel: "Governorate",
    regions: ["Muscat", "Dhofar", "Musandam", "Al Batinah North", "Al Batinah South"],
    compliance: "none-configured" as ComplianceRegime,
  },
  {
    code: "GE",
    name: "Georgia",
    currency: "GEL",
    regionLabel: "Region",
    regions: ["Tbilisi", "Adjara", "Imereti", "Kvemo Kartli"],
    compliance: "none-configured" as ComplianceRegime,
  },
  {
    code: "TH",
    name: "Thailand",
    currency: "THB",
    regionLabel: "Province",
    regions: ["Bangkok", "Phuket", "Chon Buri", "Chiang Mai", "Surat Thani"],
    compliance: "none-configured" as ComplianceRegime,
  },
  {
    code: "ID",
    name: "Indonesia",
    currency: "IDR",
    regionLabel: "Province",
    regions: ["Bali", "Jakarta", "West Java", "East Java"],
    compliance: "none-configured" as ComplianceRegime,
  },
  {
    code: "EG",
    name: "Egypt",
    currency: "EGP",
    regionLabel: "Governorate",
    regions: ["Matrouh (North Coast)", "Cairo", "Giza", "Red Sea", "South Sinai"],
    compliance: "none-configured" as ComplianceRegime,
  },
  {
    code: "US",
    name: "United States",
    currency: "USD",
    regionLabel: "State",
    regions: ["Florida", "Texas", "Georgia", "New York", "California", "Arizona"],
    compliance: "none-configured" as ComplianceRegime,
  },
  {
    code: "CY",
    name: "Cyprus",
    currency: "EUR",
    regionLabel: "District",
    regions: ["Limassol", "Paphos", "Larnaca", "Nicosia"],
    compliance: "none-configured" as ComplianceRegime,
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    regionLabel: "Region",
    regions: ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Edinburgh"],
    // No UK advertising-permit regime is modelled yet — added if a real one
    // applies once actual listings are being published here.
    compliance: "none-configured" as ComplianceRegime,
  },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ label: c.name, value: c.code }));

/** Every region across every country, for the region select. */
export const REGION_OPTIONS = COUNTRIES.flatMap((c) =>
  c.regions.map((r) => ({ label: `${r} · ${c.name}`, value: r })),
);

export const countryByCode = (code?: string | null) =>
  COUNTRIES.find((c) => c.code === code);

export const regionsFor = (code?: string | null): readonly string[] =>
  countryByCode(code)?.regions ?? [];

/** Which permit regime governs advertising property in this country. */
export const complianceFor = (code?: string | null): ComplianceRegime =>
  countryByCode(code)?.compliance ?? "none-configured";

/**
 * Trakheesi is a UAE requirement. Demanding it of a Georgian listing would be
 * wrong, and skipping it on a Dubai listing would be an offence — so the gate
 * asks the country, not a global constant.
 */
export const requiresTrakheesi = (code?: string | null): boolean =>
  complianceFor(code) === "uae-trakheesi";

/** Markets we will actually publish. Everything else is data-only until ready. */
export const LIVE_COUNTRY_CODES: CountryCode[] = ["AE"];
export const isLiveMarket = (code?: string | null): boolean =>
  LIVE_COUNTRY_CODES.includes((code ?? "") as CountryCode);
