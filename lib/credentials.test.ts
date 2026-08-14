import { describe, expect, it } from "vitest";
import { brokerNumber, whatsappHref } from "./credentials";

/*
 * A lapsed broker card does not authorise anyone to act, so publishing its
 * number against a listing misrepresents the brokerage's standing (§11.2).
 * The same reasoning drives licence suppression in getComplianceIdentity.
 */
describe("brokerNumber", () => {
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const past = new Date(Date.now() - 86_400_000).toISOString();

  it("renders a current broker number", () => {
    expect(brokerNumber("44854", future)).toBe("RERA BRN 44854");
  });
  it("renders a number with no recorded expiry", () => {
    expect(brokerNumber("44854", null)).toBe("RERA BRN 44854");
  });
  it("suppresses an expired card rather than publishing a lapsed number", () => {
    expect(brokerNumber("44854", past)).toBeNull();
  });
  it("renders nothing without a number", () => {
    expect(brokerNumber(null, future)).toBeNull();
    expect(brokerNumber("", future)).toBeNull();
  });
});

describe("whatsappHref — the CMS holds the number in whatever shape it was typed", () => {
  const expected = "https://wa.me/971585827070?text=Enquiry%20from%20rein.investments";

  it("normalises spacing, plus signs and 00 prefixes to the same link", () => {
    for (const input of [
      "+971585827070",
      "+971 58 582 7070",
      "00971585827070",
      "971 58 582 70 70",
    ]) {
      expect(whatsappHref(input)).toBe(expected);
    }
  });

  it("returns null rather than a dead button when there is no number", () => {
    expect(whatsappHref(null)).toBeNull();
    expect(whatsappHref("")).toBeNull();
    expect(whatsappHref("   ")).toBeNull();
  });

  it("rejects a number too short to dial instead of linking to a stub", () => {
    expect(whatsappHref("+971")).toBeNull();
    expect(whatsappHref("1234567")).toBeNull();
  });

  it("carries the project reference into the message when one is given", () => {
    const href = whatsappHref("+971585827070", "Enquiry — One Crescent Palm. Ref abc.");
    expect(href).toContain("One%20Crescent%20Palm");
    expect(href).toContain("wa.me/971585827070");
  });
});
