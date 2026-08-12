/**
 * Shared editorial content (§6, Appendix).
 * Verbatim brand lines live here so they cannot drift between pages.
 */

export const VERBATIM = {
  tagline: "The address before it exists.",
  positioning:
    "A modern, agile real estate investment house. We place capital into property across the UAE and beyond — off-plan, ready, and repositioned — for private investors buying in cash or on finance.",
  theTest: "If we cannot write the exit, we do not write the entry.",
  careersHeadline: "Young, not casual.",
} as const;

/**
 * The ways clients buy through us. Each is a distinct product with its own
 * maths, hold period and exit — not a variation on one listing type.
 */
export const INVESTMENT_MODELS = [
  {
    key: "off-plan",
    title: "Off-plan",
    line: "Buy before completion on a developer payment plan. Capital staged over construction, exit at or after handover.",
  },
  {
    key: "ready",
    title: "Ready, income-producing",
    line: "Completed stock let from day one. Yield from month one, no construction risk, financeable at full LTV.",
  },
  {
    key: "fix-and-flip",
    title: "Fix and flip",
    line: "Under-priced ready stock, refurbished and resold. Returns come from the works and the timeline, not the market.",
  },
  {
    key: "finance",
    title: "Cash or mortgage",
    line: "We arrange financing alongside the asset, for residents and non-residents. The borrowing ceiling decides the shortlist.",
  },
] as const;

/** The eight tests — the filter every asset runs before it reaches a client. */
export const EIGHT_TESTS = [
  {
    key: "developerRecord",
    title: "Developer record",
    body: "What they have delivered, and how late. Average handover slippage in months, not marketing claims.",
  },
  {
    key: "regulatoryStanding",
    title: "Regulatory standing",
    body: "Project registration, escrow confirmed, title clean. Verified against the register, not assumed.",
  },
  {
    key: "priceVsComparables",
    title: "Price vs comparables",
    body: "Price per square foot against what is trading in the same sub-market today, and against what completes near handover.",
  },
  {
    key: "paymentStructure",
    title: "Capital structure",
    body: "How much capital is exposed, and when. A 40/60 with a long post-handover tail is a different asset to an all-cash ready purchase.",
  },
  {
    key: "supplyInWindow",
    title: "Supply in window",
    body: "What else completes in the same market within a year either side. Your exit competes with every one of them.",
  },
  {
    key: "exitTerms",
    title: "Exit terms",
    body: "Assignment permitted, from what percentage paid, at what fee. Or for ready stock: liquidity, buyer depth, days on market.",
  },
  {
    key: "runningCost",
    title: "Running cost",
    body: "Service charge per square foot, and what it does to a net yield once the building is occupied.",
  },
  {
    key: "unitQuality",
    title: "Unit quality",
    body: "Layout efficiency, orientation, ceiling height, view protection. What resells, and what sits.",
  },
] as const;

/** The five stages of an engagement. */
export const FIVE_STAGES = [
  { n: "01", title: "Brief", line: "Capital, residency status, model, exit horizon. Twenty minutes, no deck." },
  { n: "02", title: "Filter", line: "We run the eight tests. Most assets do not pass. You see the ones that do." },
  { n: "03", title: "Structure", line: "Cash or finance, against your position. The borrowing ceiling sets the shortlist." },
  { n: "04", title: "Secure", line: "Allocation, booking, escrow-registered payment, registration." },
  { n: "05", title: "Hold", line: "Milestones, handover or works, tenancy, and the exit we wrote at the start." },
] as const;

/**
 * The secondary desk — resale and income-producing stock, as opposed to the
 * off-plan primary market. Not live yet: this drives a register-interest page,
 * and `launched` gates whether the site claims it is trading.
 */
export const SECONDARY = {
  launched: true,
  /** Where the desk will operate. Order is the order shown. */
  markets: [
    { key: "uae", name: "United Arab Emirates", note: "Dubai, Abu Dhabi, Ras Al Khaimah" },
    { key: "uk", name: "United Kingdom", note: "London, Manchester" },
    { key: "usa", name: "United States", note: "Florida, Texas" },
    { key: "egypt", name: "Egypt", note: "North Coast, Cairo" },
    { key: "georgia", name: "Georgia", note: "Tbilisi, Batumi" },
    { key: "thailand", name: "Thailand", note: "Phuket, Bangkok" },
    { key: "indonesia", name: "Indonesia", note: "Bali" },
    { key: "oman", name: "Oman", note: "Muscat" },
  ],
  /** How a resale purchase differs from buying off-plan. */
  differences: [
    {
      title: "Income from day one",
      body: "A tenanted unit pays from the month you complete. No construction window, no handover risk, and a yield you can verify against an existing lease rather than a projection.",
    },
    {
      title: "Financeable at full LTV",
      body: "Completed property borrows at the standard ceilings rather than the reduced off-plan cap, so the same equity reaches a larger asset.",
    },
    {
      title: "Priced against evidence",
      body: "Resale has transaction history. We price against what actually sold in the building, not against a developer's launch list.",
    },
    {
      title: "The exit is already liquid",
      body: "A completed unit can be sold the day after you buy it. Off-plan exits depend on assignment terms and how much you have paid in.",
    },
  ],
} as const;

/**
 * Markets we place capital into. `live` gates what the site claims today —
 * never advertise a market before the licence and the inventory exist.
 */
export const MARKETS = [
  { key: "uae", name: "United Arab Emirates", note: "Dubai, Abu Dhabi, Ras Al Khaimah", live: true },
  { key: "oman", name: "Oman", note: "Muscat", live: false },
  { key: "georgia", name: "Georgia", note: "Tbilisi, Batumi", live: false },
  { key: "thailand", name: "Thailand", note: "Phuket, Bangkok", live: false },
  { key: "indonesia", name: "Indonesia", note: "Bali", live: false },
  { key: "egypt", name: "Egypt", note: "North Coast", live: false },
  { key: "usa", name: "United States", note: "Fix and flip", live: false },
] as const;
