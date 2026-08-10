import type { GlobalConfig } from "payload";

/**
 * §8 — regulatory constants live here, never in code. Every figure carries
 * the effective date + source note rendered wherever the numbers appear.
 */
export const MortgageConstants: GlobalConfig = {
  slug: "mortgage-constants",
  access: { read: () => true },
  admin: {
    description:
      "CBUAE caps and DLD fee schedule. Verify against current circulars before launch — these render publicly with the effective date.",
  },
  fields: [
    { name: "effectiveFrom", type: "date", required: true },
    { name: "sourceNote", type: "text", required: true },
    {
      name: "ltv",
      type: "group",
      fields: [
        { name: "nationalFirstLe5MPct", type: "number", required: true },
        { name: "nationalFirstGt5MPct", type: "number", required: true },
        { name: "expatFirstLe5MPct", type: "number", required: true },
        { name: "expatFirstGt5MPct", type: "number", required: true },
        { name: "secondPropertyPct", type: "number", required: true },
        { name: "nonResidentPct", type: "number", required: true },
        { name: "offPlanPct", type: "number", required: true },
        { name: "firstPropertyThresholdAED", type: "number", required: true },
      ],
    },
    {
      name: "dbr",
      type: "group",
      fields: [
        { name: "expatPct", type: "number", required: true },
        { name: "nationalPct", type: "number", required: true },
      ],
    },
    {
      name: "tenure",
      type: "group",
      fields: [
        { name: "maxYears", type: "number", required: true },
        { name: "maxAgeSalaried", type: "number", required: true },
        { name: "maxAgeSelfEmployed", type: "number", required: true },
      ],
    },
    {
      name: "fees",
      type: "group",
      fields: [
        { name: "dldTransferPct", type: "number", required: true },
        { name: "dldAdminAED", type: "number", required: true },
        { name: "mortgageRegistrationPct", type: "number", required: true },
        { name: "mortgageRegistrationAdminAED", type: "number", required: true },
        { name: "bankArrangementPct", type: "number", required: true },
        { name: "valuationMinAED", type: "number", required: true },
        { name: "valuationMaxAED", type: "number", required: true },
        { name: "trusteeMinAED", type: "number", required: true },
        { name: "trusteeMaxAED", type: "number", required: true },
        { name: "agencyCommissionPct", type: "number", required: true },
        { name: "lifeInsurancePctAnnual", type: "number", required: true },
        { name: "propertyInsurancePctAnnual", type: "number", required: true },
      ],
    },
  ],
};
