import { describe, expect, it } from "vitest";
import {
  factsFromCardText,
  fingerprint,
  parseBedrooms,
  parseEmirate,
  parseHandover,
  parsePaymentPlan,
  parsePriceAED,
  parsePropertyTypes,
} from "./extract";

describe("field parsers", () => {
  it("parses prices in both notations", () => {
    expect(parsePriceAED("AED 1,600,000")).toBe(1_600_000);
    expect(parsePriceAED("From 2.4M")).toBe(2_400_000);
    expect(parsePriceAED("call for price")).toBeUndefined();
  });
  it("picks the price out of surrounding text without sweeping up other digits", () => {
    expect(
      parsePriceAED("1 - 3 Bedrooms. From AED 1,600,000. 60/40 plan. Handover Q4 2027."),
    ).toBe(1_600_000);
  });
  it("does not mistake bedroom counts, plan splits or years for a price", () => {
    expect(parsePriceAED("2 Bedrooms, 60/40 plan, Q4 2027")).toBeUndefined();
  });
  it("parses payment plan labels including post-handover", () => {
    expect(parsePaymentPlan("60/40 payment plan")).toBe("60/40");
    expect(parsePaymentPlan("40/30/30 post handover")).toBe("40/30/30 post-handover");
    expect(parsePaymentPlan("flexible terms")).toBeUndefined();
  });
  it("parses handover quarters", () => {
    expect(parseHandover("Handover Q4 2027")).toBe("Q4 2027");
    expect(parseHandover("completion 2027")).toBeUndefined();
  });
  it("parses bedroom ranges", () => {
    expect(parseBedrooms("1 - 3 Bedrooms")).toBe("1–3 BR");
    expect(parseBedrooms("2 BR")).toBe("2 BR");
  });
  it("parses emirate and property types", () => {
    expect(parseEmirate("Business Bay, Dubai")).toBe("Dubai");
    expect(parsePropertyTypes("Apartments and Penthouses")).toEqual(["Apartment", "Penthouse"]);
  });
});

describe("fingerprint", () => {
  it("is stable across runs for the same project", () => {
    expect(fingerprint("Seaside", "Dubai Islands", "example.com")).toBe(
      fingerprint("  seaside ", "DUBAI ISLANDS", "example.com"),
    );
  });
  it("differs across hosts and communities", () => {
    expect(fingerprint("Seaside", "Dubai Islands", "a.com")).not.toBe(
      fingerprint("Seaside", "Dubai Islands", "b.com"),
    );
    expect(fingerprint("Seaside", "Marina", "a.com")).not.toBe(
      fingerprint("Seaside", "Dubai Islands", "a.com"),
    );
  });
});

describe("factsFromCardText — the §5 boundary", () => {
  const cardText =
    "Seaside. A breathtaking waterfront sanctuary where luxury meets the horizon, " +
    "offering an unparalleled lifestyle. Apartments, 1 - 3 Bedrooms. Business Bay, Dubai. " +
    "From AED 1,600,000. 60/40 payment plan. Handover Q4 2027.";

  const facts = factsFromCardText(cardText, {
    projectName: "Seaside",
    community: "Business Bay",
    developerName: "Example Developments",
    sourceUrl: "https://example.com/projects/seaside",
  });

  it("captures only the permitted identifier fields", () => {
    expect(Object.keys(facts).sort()).toEqual(
      [
        "bedroomsRange",
        "community",
        "developerName",
        "emirate",
        "fingerprint",
        "handover",
        "paymentPlanLabel",
        "priceFromAED",
        "projectName",
        "propertyTypes",
        "sourceHost",
        "sourceUrl",
      ].sort(),
    );
  });

  it("discards marketing prose entirely — no field carries the description", () => {
    const serialised = JSON.stringify(facts).toLowerCase();
    for (const word of ["breathtaking", "sanctuary", "luxury", "unparalleled", "lifestyle", "horizon"]) {
      expect(serialised).not.toContain(word);
    }
  });

  it("extracts the facts it is meant to", () => {
    expect(facts.priceFromAED).toBe(1_600_000);
    expect(facts.paymentPlanLabel).toBe("60/40");
    expect(facts.handover).toBe("Q4 2027");
    expect(facts.emirate).toBe("Dubai");
    expect(facts.bedroomsRange).toBe("1–3 BR");
  });
});
