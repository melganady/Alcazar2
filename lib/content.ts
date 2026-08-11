/**
 * Shared editorial content used across pages (§6, Appendix).
 * Verbatim brand lines live here so they cannot drift between pages.
 */

export const VERBATIM = {
  tagline: "The address before it exists.",
  positioning:
    "A modern, agile real estate house selling tomorrow's skyline today. Built for HNW investors buying off-plan — and for the Gen Z brokers who close them.",
  theTest: "If we cannot write the exit, we do not write the entry.",
  careersHeadline: "Young, not casual.",
} as const;

/** The eight tests, §6 /how-we-work and the home filter section. */
export const EIGHT_TESTS = [
  {
    key: "developerRecord",
    title: "Developer record",
    body: "What they have delivered, and how late. Average handover slippage in months, not marketing claims.",
  },
  {
    key: "regulatoryStanding",
    title: "Regulatory standing",
    body: "DLD project registration, escrow account confirmed, Oqood eligibility. Verified, not assumed.",
  },
  {
    key: "priceVsComparables",
    title: "Price vs comparables",
    body: "Price per square foot against what is trading in the same sub-community today, and against what completes near handover.",
  },
  {
    key: "paymentStructure",
    title: "Payment structure",
    body: "How much capital is exposed before a key exists. A 40/60 with a long post-handover tail is a different asset to an 80/20.",
  },
  {
    key: "supplyInWindow",
    title: "Supply in window",
    body: "What else completes in the same community within a year either side. Your exit competes with every one of them.",
  },
  {
    key: "exitTerms",
    title: "Exit terms",
    body: "Assignment permitted, from what percentage paid, at what developer NOC fee. This is where the test gets decided.",
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

/** The five stages, §6 home and /how-we-work. */
export const FIVE_STAGES = [
  { n: "01", title: "Brief", line: "Budget, residency status, purpose, exit horizon. Twenty minutes, no deck." },
  { n: "02", title: "Filter", line: "We run the eight tests. Most launches do not pass. You see the ones that do." },
  { n: "03", title: "Structure", line: "Payment plan against your cash flow, financing route against your residency." },
  { n: "04", title: "Secure", line: "Allocation, booking, escrow-registered payment, Oqood registration." },
  { n: "05", title: "Hold", line: "Construction milestones, handover, and the exit we wrote at the start." },
] as const;
