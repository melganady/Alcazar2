import { describe, expect, it } from "vitest";
import { alternates, shouldIndexFilteredView } from "./index";

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
