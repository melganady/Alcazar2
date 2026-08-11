import { describe, expect, it } from "vitest";
import {
  extractMedia,
  mapPaymentPlan,
  mapPropertyTypes,
  mapUnitTypes,
  parseCompletion,
  parseServiceCharge,
  toProjectDraft,
} from "./reelly-adapter";

/*
 * Fixtures below are shaped from a real Reelly record (project 12,
 * "One Crescent Palm") captured via `npm run reelly:discover`, trimmed to the
 * fields we map. If Reelly changes the schema, these fail rather than the
 * import silently producing malformed drafts.
 */

const CONTRACT = "REELLY-2026-001";

const RECORD = {
  id: 12,
  slug_name: "one-crescent-palm",
  name: "One Crescent Palm",
  developer: "AHS Properties",
  construction_status: "under_construction",
  sale_status: "on_sale",
  completion_date: "Q2 2026",
  escrow_number: "12711866920002",
  service_charge: "26 AED/sqft",
  post_handover: false,
  min_price: 180000000.004825,
  max_price: 180000000.004825,
  min_size: 22600.1783592,
  max_size: 22600.1783592,
  min_bedrooms: 6,
  max_bedrooms: 6,
  available_unit_types: ["penthouse"],
  available_unit_types_display: ["Penthouse"],
  location: { region: "Dubai", district: "Palm Jumeirah", sector: "Palm Jumeirah" },
  cover_image: { url: "https://api.reelly.io/vault/cover.png", metadata: { mime: "image/png" } },
  architecture: [{ url: "https://api.reelly.io/vault/a1.jpg" }, { url: "https://api.reelly.io/vault/a2.jpg" }],
  interior: [{ url: "https://api.reelly.io/vault/i1.jpg" }],
  lobby: [{ url: "https://api.reelly.io/vault/l1.jpg" }],
  general_plan: { url: "https://api.reelly.io/vault/master.png" },
  payment_plans: [
    {
      id: 39,
      name: "Payment plan",
      steps: [
        { id: 7167, name: "On booking", percentage: 20 },
        { id: 7168, name: "During construction", percentage: 50 },
        { id: 7169, name: "On handover", percentage: 30 },
      ],
    },
  ],
  typical_units: [
    { bedrooms: 6, from_price_aed: 180000000, to_price_aed: 180000000, from_size_sqft: 22600, to_size_sqft: 22600 },
  ],
};

describe("field parsers", () => {
  it('parses "Q2 2026" into a quarter and a year', () => {
    expect(parseCompletion("Q2 2026")).toEqual({ quarter: "Q2", year: 2026 });
  });
  it("falls back to the year alone when no quarter is given", () => {
    expect(parseCompletion("2027")).toEqual({ year: 2027 });
    expect(parseCompletion(null)).toEqual({});
  });
  it('parses "26 AED/sqft" into a number', () => {
    expect(parseServiceCharge("26 AED/sqft")).toBe(26);
    expect(parseServiceCharge(null)).toBeUndefined();
  });
  it("maps unit-type display values onto our enum, defaulting to Apartment", () => {
    expect(mapPropertyTypes(["Penthouse"])).toEqual(["Penthouse"]);
    expect(mapPropertyTypes(["Villa", "Townhouse"])).toEqual(["Villa", "Townhouse"]);
    expect(mapPropertyTypes(["Serviced Plot"])).toEqual(["Apartment"]);
    expect(mapPropertyTypes(undefined)).toEqual(["Apartment"]);
  });
});

describe("extractMedia", () => {
  it("collects every gallery, cover first so it becomes the hero", () => {
    const urls = extractMedia(RECORD);
    expect(urls[0]).toBe("https://api.reelly.io/vault/cover.png");
    expect(urls).toHaveLength(6); // cover + 2 architecture + 1 interior + 1 lobby + master plan
  });
  it("de-duplicates and rejects anything that is not an absolute URL", () => {
    expect(
      extractMedia({
        architecture: [{ url: "https://cdn/a.jpg" }, { url: "https://cdn/a.jpg" }],
        interior: ["/relative.jpg"],
      }),
    ).toEqual(["https://cdn/a.jpg"]);
  });
  it("returns nothing for a record with no imagery", () => {
    expect(extractMedia({ name: "No pictures" })).toEqual([]);
  });
});

describe("mapPaymentPlan", () => {
  it("derives the split from the steps and keeps them as milestones", () => {
    const plan = mapPaymentPlan(RECORD);
    expect(plan.duringConstructionPct).toBe(70); // booking 20 + construction 50
    expect(plan.onHandoverPct).toBe(30);
    expect(plan.label).toBe("70/30");
    expect(plan.milestones).toHaveLength(3);
    expect(plan.milestones[0]).toEqual({ label: "On booking", pct: 20, trigger: "On booking" });
  });
  it("marks a post-handover plan in the label", () => {
    expect(mapPaymentPlan({ ...RECORD, post_handover: true }).label).toBe("70/30 post-handover");
  });
  it("survives a project with no payment plan", () => {
    const plan = mapPaymentPlan({ name: "No plan" });
    expect(plan.milestones).toEqual([]);
    expect(plan.label).toBe("");
  });
});

describe("mapUnitTypes", () => {
  it("maps typical_units onto our unit rows", () => {
    expect(mapUnitTypes(RECORD)).toEqual([
      {
        label: "6 BR",
        bedrooms: 6,
        sizeSqftMin: 22600,
        sizeSqftMax: 22600,
        priceFromAED: 180000000,
        availability: "available",
      },
    ]);
  });
  it("labels a zero-bedroom unit as a studio", () => {
    expect(mapUnitTypes({ typical_units: [{ bedrooms: 0 }] })[0].label).toBe("Studio");
  });
});

describe("toProjectDraft", () => {
  const d = toProjectDraft(RECORD, CONTRACT)!;

  it("maps identity and location", () => {
    expect(d.name).toBe("One Crescent Palm");
    expect(d.subCommunity).toBe("Palm Jumeirah");
    expect(d.emirate).toBe("Dubai");
    expect(d.slug).toBe("one-crescent-palm-palm-jumeirah");
  });

  it("rounds the float prices and sizes the API returns", () => {
    expect(d.priceFromAED).toBe(180_000_000);
    expect(d.sizeFromSqft).toBe(22_600);
  });

  it("maps construction status onto our vocabulary", () => {
    expect(d.status).toBe("under-construction");
    expect(toProjectDraft({ ...RECORD, sale_status: "sold_out" }, CONTRACT)!.status).toBe("sold-out");
  });

  it("treats an escrow number as escrow confirmed (§11.4)", () => {
    expect(d.escrowAccountConfirmed).toBe(true);
    expect(d.dldProjectNumber).toBe("12711866920002");
    expect(toProjectDraft({ ...RECORD, escrow_number: null }, CONTRACT)!.escrowAccountConfirmed).toBe(false);
  });

  it("records the licence so the display right is auditable (§11.9)", () => {
    expect(d.mediaLicence).toBe("developer-supplied");
    expect(d.mediaLicenceNote).toContain(CONTRACT);
    expect(d.mediaLicenceNote).toContain("Reelly");
  });

  it("never sets publishedAt — a data licence is not an advertising permit", () => {
    expect(d).not.toHaveProperty("publishedAt");
  });

  it("resolves a non-Dubai emirate rather than defaulting silently", () => {
    const rak = toProjectDraft(
      { ...RECORD, location: { region: "Ras Al Khaimah", district: "Al Marjan Island" } },
      CONTRACT,
    )!;
    expect(rak.emirate).toBe("Ras Al Khaimah");
    expect(rak.subCommunity).toBe("Al Marjan Island");
  });

  it("rejects a record with no name instead of inventing one", () => {
    expect(toProjectDraft({ id: 99 }, CONTRACT)).toBeNull();
  });

  it("produces a URL-safe slug from an accented name", () => {
    expect(toProjectDraft({ name: "Águila Tower II", location: { sector: "Al Marjan" } }, CONTRACT)!.slug)
      .toMatch(/^[a-z0-9-]+$/);
  });

  it("survives a sparse record without throwing", () => {
    const sparse = toProjectDraft({ name: "Sparse" }, CONTRACT)!;
    expect(sparse.priceFromAED).toBe(0);
    expect(sparse.bedroomsMin).toBe(0);
    expect(sparse.unitTypes).toEqual([]);
  });
});
