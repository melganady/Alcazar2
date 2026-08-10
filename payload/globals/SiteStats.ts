import type { GlobalConfig } from "payload";

/**
 * "Of N launches reviewed this year, X reached a client shortlist."
 * The counts render only when reviewsTracked is on — never faked (§6).
 * Market-bar stats each carry a source and date (§11.10).
 */
export const SiteStats: GlobalConfig = {
  slug: "site-stats",
  access: { read: () => true },
  fields: [
    { name: "reviewsTracked", type: "checkbox", defaultValue: false },
    {
      type: "row",
      fields: [
        { name: "launchesReviewedThisYear", type: "number" },
        { name: "reachedShortlistThisYear", type: "number" },
      ],
    },
    {
      name: "marketStats",
      type: "array",
      maxRows: 4,
      fields: [
        { name: "value", type: "text", required: true },
        { name: "label", type: "text", required: true },
        { name: "source", type: "text", required: true },
        { name: "asOf", type: "date", required: true },
      ],
    },
  ],
};
