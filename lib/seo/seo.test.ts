import { describe, expect, it } from "vitest";
import { alternates, planPhrase, projectTitle, shouldIndexFilteredView } from "./index";

describe("shouldIndexFilteredView — §10 thin-content guard", () => {
  it("indexes the unfiltered index", () => {
    expect(shouldIndexFilteredView([], 40)).toBe(true);
  });
  it("indexes a single high-value facet with enough results", () => {
    expect(shouldIndexFilteredView(["community"], 5)).toBe(true);
    expect(shouldIndexFilteredView(["handover"], 3)).toBe(true);
  });
  it("noindexes a single facet with too few results", () => {
    expect(shouldIndexFilteredView(["community"], 2)).toBe(false);
  });
  it("noindexes multi-facet combinations", () => {
    expect(shouldIndexFilteredView(["community", "beds"], 40)).toBe(false);
  });
  it("noindexes facets outside the indexable set", () => {
    expect(shouldIndexFilteredView(["priceMin"], 40)).toBe(false);
    expect(shouldIndexFilteredView(["sort"], 40)).toBe(false);
  });
});

describe("alternates — hreflang pairing", () => {
  it("pairs en and ar for a nested path", () => {
    const a = alternates("/projects/seaside");
    expect(a.languages.en).toMatch(/\/projects\/seaside$/);
    expect(a.languages.ar).toMatch(/\/ar\/projects\/seaside$/);
  });
  it("does not emit a trailing slash for the root ar path", () => {
    expect(alternates("/").languages.ar).toMatch(/\/ar$/);
  });
});

describe("projectTitle and planPhrase — the feed leaves fields blank", () => {
  const base = {
    name: "Sensi",
    subCommunity: "Al Saadiyat Island",
    paymentPlan: { label: null },
    handoverQuarter: null,
    handoverYear: null,
  } as unknown as Parameters<typeof projectTitle>[0];

  const withPlan = (label: string | null, q?: string | null, y?: number | null) =>
    ({ ...base, paymentPlan: { label }, handoverQuarter: q ?? null, handoverYear: y ?? null }) as typeof base;

  it("does not repeat 'payment plan' when the feed label already says it", () => {
    expect(planPhrase("4 Years Post Handover Payment Plan", "Payment Plan")).toBe(
      "4 Years Post Handover Payment Plan",
    );
    expect(planPhrase("60/40", "Payment Plan")).toBe("60/40 Payment Plan");
    expect(planPhrase("60/40", "payment plan")).toBe("60/40 payment plan");
  });

  it("returns null for a blank label so the clause can be dropped", () => {
    expect(planPhrase(null, "Payment Plan")).toBeNull();
    expect(planPhrase("   ", "Payment Plan")).toBeNull();
  });

  it("omits handover entirely rather than printing 'null null'", () => {
    expect(projectTitle(withPlan(null))).toBe("Sensi, Al Saadiyat Island");
    expect(projectTitle(withPlan(null, "Q1", null))).toBe("Sensi, Al Saadiyat Island");
  });

  it("builds the full title when the feed gave us everything", () => {
    expect(projectTitle(withPlan("60/40", "Q1", 2028))).toBe(
      "Sensi, Al Saadiyat Island — 60/40 Payment Plan, Handover Q1 2028",
    );
  });
});
