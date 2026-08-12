import type { CollectionConfig } from "payload";
import { fixtureField, hideFixtures } from "./shared";

export const Lenders: CollectionConfig = {
  slug: "lenders",
  admin: { useAsTitle: "name", defaultColumns: ["name", "onPanel", "financesOffplan"] },
  access: { read: () => true },
  hooks: { beforeOperation: [hideFixtures] },
  fields: [
    fixtureField,
    { name: "name", type: "text", required: true },
    { name: "logo", type: "upload", relationTo: "media" },
    { name: "maxLtvResidentPct", type: "number", min: 0, max: 100 },
    { name: "maxLtvNonResidentPct", type: "number", min: 0, max: 100 },
    { name: "financesOffplan", type: "checkbox", defaultValue: false },
    { name: "minMonthlyIncomeAED", type: "number" },
    { name: "minMonthlyIncomeNonResidentUSD", type: "number" },
    { name: "indicativeFixedRatePct", type: "number" },
    { name: "fixedPeriodYears", type: "number" },
    { name: "notes", type: "textarea" },
    { name: "onPanel", type: "checkbox", defaultValue: false },
    {
      name: "ratesEffectiveFrom",
      type: "date",
      admin: {
        description:
          "§11.10 — no rate or LTV renders publicly without an effective date and source.",
      },
    },
    { name: "sourceNote", type: "text" },
  ],
};
