import type { CollectionConfig } from "payload";
import { ValidationError } from "payload";
import { PROPERTY_TYPES, hideFixtures } from "./shared";
import { COUNTRY_OPTIONS, REGION_OPTIONS, requiresTrakheesi } from "./markets";
import { revalidateProject, revalidateProjectOnDelete } from "../hooks/revalidate";

const FILTER_TESTS = [
  ["developerRecord", "Developer record"],
  ["regulatoryStanding", "Regulatory standing"],
  ["priceVsComparables", "Price vs comparables"],
  ["paymentStructure", "Payment structure"],
  ["supplyInWindow", "Supply in window"],
  ["exitTerms", "Exit terms"],
  ["runningCost", "Running cost"],
  ["unitQuality", "Unit quality"],
] as const;

export const Projects: CollectionConfig = {
  slug: "projects",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "subCommunity", "alcazarStatus", "publishedAt"],
    description:
      "A project cannot be published without media licence, Trakheesi permit, our verdict, and complete core facts. The publish gate lists anything missing.",
  },
  access: { read: () => true },
  hooks: {
    beforeOperation: [hideFixtures],
    // Saving in the admin rebuilds the affected pages straight away, so a new
    // listing is live the moment it is published rather than within the hour.
    afterChange: [revalidateProject],
    afterDelete: [revalidateProjectOnDelete],
    beforeChange: [
      ({ data }) => {
        // Computed, overridable (§4): price/sqft and Golden Visa eligibility
        if (
          data.pricePerSqftFrom == null &&
          data.priceFromAED &&
          data.sizeFromSqft
        ) {
          data.pricePerSqftFrom = Math.round(data.priceFromAED / data.sizeFromSqft);
        }
        // Gross yield, from the contracted rent and the asking price. Computed
        // rather than typed so the number on the page always agrees with the
        // two figures beside it.
        if (data.listingType === "secondary") {
          const rent = data.resale?.currentAnnualRentAED;
          data.resale = data.resale ?? {};
          data.resale.grossYieldPct =
            rent && data.priceFromAED
              ? Math.round((rent / data.priceFromAED) * 1000) / 10
              : null;
        }
        if (data.goldenVisaEligible == null && data.priceFromAED != null) {
          // AED 2M threshold — CMS-editable per-project override; threshold
          // itself must be verified before launch (§11.10)
          data.goldenVisaEligible = data.priceFromAED >= 2_000_000;
        }

        // Publish gate (§5) — hard-block setting publishedAt with gaps
        if (data.publishedAt) {
          const missing: string[] = [];
          if (!data.mediaLicence || data.mediaLicence === "unlicensed") {
            missing.push("media licence must be developer-supplied or own photography");
          }
          // §11.1 applies to UAE adverts. Demanding it of a Georgian listing
          // would be wrong; skipping it on a Dubai listing would be an offence.
          if (requiresTrakheesi(data.country) && !data.trakheesiPermitNumber) {
            missing.push("Trakheesi permit number (§11.1, required for UAE listings)");
          }
          const verdictEmpty =
            !data.alcazarVerdict ||
            JSON.stringify(data.alcazarVerdict).indexOf('"text"') === -1;
          if (verdictEmpty) missing.push("REIN Investment verdict (our own written view)");
          if (!data.developer) missing.push("developer");
          if (data.priceFromAED == null) missing.push("price from (AED)");

          // A completed home has no handover date and no construction payment
          // plan; asking for them would block every resale listing. What it
          // does need is the tenancy position — a buyer's first question is
          // whether they can move in, and a tenanted unit cannot be vacated
          // at will under UAE tenancy law.
          if (data.listingType === "secondary") {
            if (!data.resale?.tenancy) missing.push("tenancy position (vacant or tenanted)");
            if (data.resale?.tenancy === "tenanted" && data.resale?.currentAnnualRentAED == null) {
              missing.push("current annual rent (the listing claims income)");
            }
            if (data.sizeFromSqft == null) missing.push("size (sqft)");
          } else {
            if (!data.handoverQuarter) missing.push("handover quarter");
            if (!data.handoverYear) missing.push("handover year");
            if (
              data.paymentPlan?.duringConstructionPct == null ||
              data.paymentPlan?.onHandoverPct == null
            ) {
              missing.push("payment plan percentages");
            }
          }

          // The gate always names the gaps. Whether they block is a deployment
          // decision the operator makes once, in the environment, rather than
          // per record in the admin UI — so a listing is never advertised with
          // gaps by accident, only by policy. The gaps stay logged either way.
          if (missing.length > 0) {
            if (process.env.ALLOW_INCOMPLETE_PUBLISH === "true") {
              console.warn(
                `[publish gate] ${data.slug ?? data.name} published with gaps: ${missing.join("; ")}`,
              );
            } else {
              throw new ValidationError({
                errors: [
                  {
                    path: "publishedAt",
                    message: `Cannot publish — missing: ${missing.join("; ")}.`,
                  },
                ],
              });
            }
          }
        }
        return data;
      },
    ],
  },
  fields: [
    // ---- Identity ----
    {
      name: "listingType",
      type: "select",
      // Deliberately not required: rows written before this field existed have
      // no value, and every query treats "missing" as off-plan.
      defaultValue: "offplan",
      index: true,
      options: [
        { label: "Off-plan — bought before completion, on a payment plan", value: "offplan" },
        { label: "Secondary — completed property, resold by its owner", value: "secondary" },
      ],
      admin: {
        position: "sidebar",
        description:
          "Decides which fields below apply, which index the listing appears in, and what the page shows. Off-plan carries a payment plan and a handover date; secondary carries tenancy, yield and comparable sales.",
      },
    },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "name", type: "text", required: true },
    { name: "subCommunity", type: "text", required: true },
    { name: "community", type: "relationship", relationTo: "communities" },
    {
      name: "country",
      type: "select",
      required: true,
      options: COUNTRY_OPTIONS,
      defaultValue: "AE",
      admin: {
        description:
          "Decides which advertising rules apply. UAE listings require a Trakheesi permit; other markets have their own regime.",
      },
    },
    {
      name: "region",
      type: "select",
      required: true,
      options: REGION_OPTIONS,
      defaultValue: "Dubai",
      admin: { description: "Emirate, governorate, province or state, depending on the country." },
    },
    { name: "developer", type: "relationship", relationTo: "developers" },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pre-launch",
      options: [
        "pre-launch",
        "launched",
        "under-construction",
        "nearing-handover",
        "handed-over",
        "sold-out",
      ],
    },

    // ---- Product ----
    {
      name: "propertyTypes",
      type: "select",
      hasMany: true,
      required: true,
      options: PROPERTY_TYPES,
    },
    {
      type: "row",
      fields: [
        { name: "bedroomsMin", type: "number", required: true, min: 0, admin: { description: "0 = studio" } },
        { name: "bedroomsMax", type: "number", required: true, min: 0 },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "priceFromAED", type: "number", required: true },
        { name: "priceToAED", type: "number" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "sizeFromSqft", type: "number", required: true },
        { name: "sizeToSqft", type: "number" },
      ],
    },
    {
      name: "pricePerSqftFrom",
      type: "number",
      admin: { description: "Computed from price/size when left empty; override if needed." },
    },

    // ---- Payment plan ----
    {
      name: "paymentPlan",
      admin: { condition: (data) => data?.listingType !== "secondary" },
      type: "group",
      fields: [
        { name: "label", type: "text", required: true, admin: { description: '"60/40", "80/20", "50/50 post-handover"' } },
        {
          type: "row",
          fields: [
            { name: "duringConstructionPct", type: "number", min: 0, max: 100 },
            { name: "onHandoverPct", type: "number", min: 0, max: 100 },
            { name: "postHandoverPct", type: "number", min: 0, max: 100 },
            { name: "postHandoverMonths", type: "number" },
          ],
        },
        {
          name: "milestones",
          type: "array",
          fields: [
            { name: "label", type: "text", required: true },
            { name: "pct", type: "number", required: true, min: 0, max: 100 },
            { name: "trigger", type: "text", required: true, admin: { description: 'e.g. "On booking", "30% construction", "Handover"' } },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "handoverQuarter", type: "select", options: ["Q1", "Q2", "Q3", "Q4"] },
        { name: "handoverYear", type: "number" },
        { name: "launchDate", type: "date" },
      ],
    },

    // ---- Regulatory ----
    { name: "dldProjectNumber", type: "text", admin: { description: "DLD/RERA project registration" } },
    {
      type: "row",
      fields: [
        {
          name: "escrowAccountConfirmed",
          type: "checkbox",
          defaultValue: false,
          admin: { condition: (data) => data?.listingType !== "secondary" },
        },
        {
          name: "oqoodEligible",
          type: "checkbox",
          defaultValue: false,
          admin: { condition: (data) => data?.listingType !== "secondary" },
        },
        { name: "freehold", type: "checkbox", defaultValue: true },
        { name: "goldenVisaEligible", type: "checkbox", admin: { description: "Auto-set from AED 2M threshold when left unset; override allowed." } },
      ],
    },
    { name: "serviceChargeEstimateAEDPerSqft", type: "number" },
    {
      name: "amenities",
      type: "text",
      hasMany: true,
      admin: { description: "Supplied by the feed or the developer pack." },
    },
    {
      name: "furnishing",
      type: "text",
      admin: { description: 'e.g. "Unfurnished", "Semi-furnished".' },
    },

    // ---- Unit detail. Off-plan quotes a range; a resale unit is one home,
    // ---- and a buyer asks about its bathrooms, plot and parking. ----
    {
      type: "row",
      fields: [
        { name: "bathrooms", type: "number", min: 0 },
        { name: "parkingSpaces", type: "number", min: 0 },
        {
          name: "plotSizeSqft",
          type: "number",
          min: 0,
          admin: { description: "Townhouses and villas. Leave blank for apartments." },
        },
      ],
    },
    { name: "maidsRoom", type: "checkbox", defaultValue: false },
    {
      name: "readinessPct",
      type: "number",
      min: 0,
      max: 100,
      admin: {
        description: "Construction progress, where the source reports it.",
        condition: (data) => data?.listingType !== "secondary",
      },
    },
    {
      name: "nearbyPlaces",
      type: "array",
      admin: { description: "Walk/drive times used by the location section (§6.6)." },
      fields: [
        { name: "name", type: "text", required: true },
        { name: "distanceKm", type: "number" },
        { name: "minutes", type: "number" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "assignmentAllowed", type: "checkbox" },
        { name: "assignmentMinPaidPct", type: "number", min: 0, max: 100 },
        { name: "developerNocFeeAED", type: "number" },
      ],
    },

    // ---- Secondary only ----
    // A completed home is a different object from a launch. It has a tenant or
    // it does not, it has a rent that either justifies the price or does not,
    // and — unlike off-plan — the building it sits in has a sales history.
    {
      type: "group",
      name: "resale",
      label: "Secondary listing",
      admin: {
        condition: (data) => data?.listingType === "secondary",
        description: "Applies to completed property only.",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "tenancy",
              type: "select",
              defaultValue: "vacant",
              options: [
                { label: "Vacant on transfer", value: "vacant" },
                { label: "Tenanted — income from day one", value: "tenanted" },
                { label: "Owner-occupied — vacant on completion", value: "owner-occupied" },
              ],
            },
            {
              name: "availableFrom",
              type: "date",
              admin: {
                description:
                  "When the buyer can occupy. For a tenanted unit this is the end of the current contract, and it is the first thing an end-user asks.",
              },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "currentAnnualRentAED",
              type: "number",
              min: 0,
              admin: { description: "The contracted rent, not an estimate." },
            },
            {
              name: "grossYieldPct",
              type: "number",
              admin: {
                readOnly: true,
                description: "Computed from rent ÷ price. Blank until both are known.",
              },
            },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "yearBuilt", type: "number", min: 1960 },
            {
              name: "floor",
              type: "text",
              admin: { description: 'Apartments — e.g. "12", "Ground", "Penthouse".' },
            },
            { name: "view", type: "text", admin: { description: 'e.g. "Marina", "Park".' } },
          ],
        },
        {
          name: "titleDeedNumber",
          type: "text",
          admin: {
            description:
              "The DLD title deed for the unit. Held for verification — never rendered on the page.",
          },
        },
        // The evidence behind the price. REIN Investment's claim on secondary is that
        // it prices against what actually sold in the building; this is where
        // that claim is either substantiated or it is not.
        {
          name: "comparables",
          type: "array",
          label: "Comparable transactions",
          admin: {
            description:
              "Recorded sales and lettings in the same building or community, from DLD data. Shown on the listing as the evidence for the asking price.",
          },
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "kind",
                  type: "select",
                  required: true,
                  defaultValue: "sold",
                  options: [
                    { label: "Sold", value: "sold" },
                    { label: "Let", value: "let" },
                  ],
                },
                { name: "date", type: "date", required: true },
                {
                  name: "amountAED",
                  type: "number",
                  required: true,
                  admin: { description: "Sale price, or annual rent for a letting." },
                },
                { name: "sizeSqft", type: "number", min: 0 },
                { name: "bedrooms", type: "number", min: 0 },
              ],
            },
          ],
        },
      ],
    },

    // ---- The REIN Investment layer ----
    {
      name: "alcazarStatus",
      type: "select",
      required: true,
      defaultValue: "monitoring",
      options: ["shortlisted", "monitoring", "declined"],
      admin: { position: "sidebar" },
    },
    {
      name: "alcazarVerdict",
      type: "richText",
      admin: { description: "Our own written view, 80–150 words. Never sourced from a competitor's text. This is the product." },
    },
    {
      name: "alcazarFilterScores",
      type: "group",
      admin: { description: "The eight tests. 1 = fail, 5 = strong." },
      fields: FILTER_TESTS.map(([name, label]) => ({
        name,
        label,
        type: "number" as const,
        min: 1,
        max: 5,
      })),
    },
    {
      name: "declineReason",
      type: "textarea",
      admin: {
        condition: (data) => data?.alcazarStatus === "declined",
        description:
          "Factual test outcomes only — no characterisations. Legal review required before any declined page goes public.",
      },
    },
    {
      name: "declinePublic",
      type: "checkbox",
      defaultValue: false,
      admin: {
        condition: (data) => data?.alcazarStatus === "declined",
        description: "Render a public stripped page for this declined project. Case-by-case decision (§6).",
      },
    },

    // ---- Financing ----
    {
      name: "mortgageable",
      type: "select",
      defaultValue: "unknown",
      options: ["yes", "at-handover-only", "no", "unknown"],
    },
    { name: "lendersFinancing", type: "relationship", relationTo: "lenders", hasMany: true },

    // ---- Media + licence ----
    {
      name: "media",
      type: "group",
      fields: [
        { name: "hero", type: "upload", relationTo: "media" },
        { name: "gallery", type: "upload", relationTo: "media", hasMany: true },
        { name: "floorPlans", type: "upload", relationTo: "media", hasMany: true },
        { name: "brochure", type: "upload", relationTo: "media" },
        { name: "video", type: "text" },
      ],
    },
    {
      name: "mediaLicence",
      type: "select",
      required: true,
      defaultValue: "unlicensed",
      options: ["developer-supplied", "own-photography", "unlicensed"],
      admin: {
        position: "sidebar",
        description: "§11.9 — no image renders without a licence. Log the developer permission grant in the note.",
      },
    },
    { name: "mediaLicenceNote", type: "text", admin: { position: "sidebar", description: "Contact + date of the permission grant." } },
    {
      name: "trakheesiPermitNumber",
      type: "text",
      admin: {
        position: "sidebar",
        condition: (data) => requiresTrakheesi(data?.country),
        description: "§11.1 — required before a UAE listing can publish. Renders on the page.",
      },
    },

    // ---- SEO + publishing ----
    {
      name: "seo",
      type: "group",
      fields: [
        { name: "title", type: "text" },
        { name: "description", type: "textarea" },
        { name: "ogImage", type: "upload", relationTo: "media" },
      ],
    },
    { name: "publishedAt", type: "date", admin: { position: "sidebar" } },
    {
      name: "editorialOrder",
      type: "number",
      admin: { position: "sidebar", description: "Sort order for the home shortlist strip." },
    },
    {
      name: "isFixture",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar", description: "Development seed data — excluded from production builds." },
    },

    // ---- Unit types (child rows, §4 UnitType) ----
    {
      name: "unitTypes",
      type: "array",
      fields: [
        { name: "label", type: "text", required: true },
        {
          type: "row",
          fields: [
            { name: "bedrooms", type: "number", required: true, min: 0 },
            { name: "bathrooms", type: "number" },
            { name: "sizeSqftMin", type: "number" },
            { name: "sizeSqftMax", type: "number" },
            { name: "priceFromAED", type: "number" },
          ],
        },
        { name: "floorPlan", type: "upload", relationTo: "media" },
        {
          name: "availability",
          type: "select",
          defaultValue: "available",
          options: ["available", "limited", "sold-out"],
        },
        { name: "view", type: "text" },
        { name: "orientation", type: "text" },
      ],
    },
  ],
};
