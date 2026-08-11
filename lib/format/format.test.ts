import { describe, expect, it } from "vitest";
import { formatHandoverOrDash } from "./index";

describe("formatHandoverOrDash", () => {
  it("formats a complete handover date", () => {
    expect(formatHandoverOrDash("Q2", 2026)).toBe("Q2 2026");
  });
  it("falls back to the year alone", () => {
    expect(formatHandoverOrDash(null, 2027)).toBe("2027");
  });
  it("never renders 'null null' when the feed has no date", () => {
    expect(formatHandoverOrDash(null, null)).toBe("—");
    expect(formatHandoverOrDash(undefined, undefined)).toBe("—");
    expect(formatHandoverOrDash("Q2", null)).toBe("—");
  });
});
