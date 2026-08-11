import { describe, expect, it } from "vitest";
import { extractMedia, toProjectDraft } from "./reelly-adapter";

/*
 * Reelly does not publish the project schema, so the adapter reads each value
 * from the first key that exists. These tests pin that behaviour against the
 * naming variants the field could plausibly arrive under, so a schema surprise
 * on import day is a failing test rather than 400 malformed drafts.
 *
 * Replace these fixtures with a real record from `npm run reelly:discover`
 * once the key is live.
 */

const CONTRACT = "REELLY-TEST-001";

describe("extractMedia", () => {
  it("reads the documented { url, metadata } media shape", () => {
    expect(
      extractMedia({
        images: [
          { url: "https://cdn.reelly.io/a.jpg", metadata: { mime: "image/jpeg" } },
          { url: "https://cdn.reelly.io/b.jpg" },
        ],
      }),
    ).toEqual(["https://cdn.reelly.io/a.jpg", "https://cdn.reelly.io/b.jpg"]);
  });

  it("also accepts plain string arrays and a single cover image", () => {
    expect(extractMedia({ photos: ["https://cdn/x.jpg"] })).toEqual(["https://cdn/x.jpg"]);
    expect(extractMedia({ cover: { url: "https://cdn/c.jpg" } })).toEqual(["https://cdn/c.jpg"]);
  });

  it("de-duplicates and drops anything that is not an absolute URL", () => {
    expect(
      extractMedia({
        images: [{ url: "https://cdn/a.jpg" }, { url: "https://cdn/a.jpg" }],
        gallery: ["/relative/path.jpg", "not-a-url"],
      }),
    ).toEqual(["https://cdn/a.jpg"]);
  });

  it("returns an empty list when the record carries no media", () => {
    expect(extractMedia({ name: "No pictures" })).toEqual([]);
  });
});

describe("toProjectDraft", () => {
  const record = {
    name: "Seaside",
    area: "Dubai Islands",
    city: "Dubai",
    min_price: 1600000,
    min_area: 720,
    min_bedrooms: 1,
    max_bedrooms: 3,
    payment_plan: "60/40",
    handover_year: 2028,
    developer: "Meridian Developments",
  };

  it("maps a well-formed record", () => {
    const d = toProjectDraft(record, CONTRACT)!;
    expect(d.name).toBe("Seaside");
    expect(d.subCommunity).toBe("Dubai Islands");
    expect(d.emirate).toBe("Dubai");
    expect(d.priceFromAED).toBe(1_600_000);
    expect(d.bedroomsMin).toBe(1);
    expect(d.bedroomsMax).toBe(3);
    expect(d.handoverYear).toBe(2028);
    expect(d.paymentPlan.label).toBe("60/40");
  });

  it("builds a stable, URL-safe slug", () => {
    expect(toProjectDraft(record, CONTRACT)!.slug).toBe("seaside-dubai-islands");
    expect(
      toProjectDraft({ name: "Águila Tower II", area: "Al Marjan" }, CONTRACT)!.slug,
    ).toMatch(/^[a-z0-9-]+$/);
  });

  it("records the licence so the display right is auditable (§11.9)", () => {
    const d = toProjectDraft(record, CONTRACT)!;
    expect(d.mediaLicence).toBe("developer-supplied");
    expect(d.mediaLicenceNote).toContain(CONTRACT);
    expect(d.mediaLicenceNote).toContain("Reelly");
  });

  it("never sets publishedAt — a data licence is not an advertising permit", () => {
    expect(toProjectDraft(record, CONTRACT)).not.toHaveProperty("publishedAt");
  });

  it("tolerates the alternative field names the schema might use", () => {
    const d = toProjectDraft(
      {
        title: "Marea",
        community: "Business Bay",
        emirate: "Dubai",
        starting_price: "AED 2,400,000",
        completion_year: "2027",
        developer_name: "Northlight Group",
      },
      CONTRACT,
    )!;
    expect(d.name).toBe("Marea");
    expect(d.subCommunity).toBe("Business Bay");
    expect(d.priceFromAED).toBe(2_400_000);
    expect(d.handoverYear).toBe(2027);
    expect(d.developerName).toBe("Northlight Group");
  });

  it("resolves a non-Dubai emirate rather than defaulting silently", () => {
    expect(toProjectDraft({ name: "The Strand", city: "Ras Al Khaimah" }, CONTRACT)!.emirate)
      .toBe("Ras Al Khaimah");
  });

  it("rejects a record with no name instead of inventing one", () => {
    expect(toProjectDraft({ area: "Dubai Marina" }, CONTRACT)).toBeNull();
  });

  it("leaves missing numerics at a safe zero rather than guessing", () => {
    const d = toProjectDraft({ name: "Sparse", area: "Meydan" }, CONTRACT)!;
    expect(d.priceFromAED).toBe(0);
    expect(d.sizeFromSqft).toBe(0);
    expect(d.paymentPlan.label).toBe("");
  });
});
