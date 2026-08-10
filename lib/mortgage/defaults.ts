import type { MortgageConstants } from "./types";

/**
 * Seed values mirroring the brief's §8 table (CBUAE Circular 31/2013 as
 * amended 2020, as commonly applied). UNVERIFIED — compliance sign-off is a
 * launch blocker (§11.10). The CMS copy of this object is the runtime source;
 * this default exists for tests and as the seed.
 */
export const DEFAULT_MORTGAGE_CONSTANTS: MortgageConstants = {
  effectiveFrom: "2026-07-01",
  sourceNote:
    "CBUAE lending caps as commonly applied by UAE banks; DLD fee schedule. Unverified seed values — confirm before launch.",
  ltv: {
    nationalFirstLe5MPct: 85,
    nationalFirstGt5MPct: 75,
    expatFirstLe5MPct: 80,
    expatFirstGt5MPct: 70,
    secondPropertyPct: 60,
    nonResidentPct: 60,
    offPlanPct: 50,
    firstPropertyThresholdAED: 5_000_000,
  },
  dbr: {
    expatPct: 50,
    nationalPct: 60,
  },
  tenure: {
    maxYears: 25,
    maxAgeSalaried: 65,
    maxAgeSelfEmployed: 70,
  },
  fees: {
    dldTransferPct: 4,
    dldAdminAED: 580,
    mortgageRegistrationPct: 0.25,
    mortgageRegistrationAdminAED: 290,
    bankArrangementPct: 1,
    valuationMinAED: 2500,
    valuationMaxAED: 3500,
    trusteeMinAED: 2000,
    trusteeMaxAED: 4000,
    agencyCommissionPct: 2,
    lifeInsurancePctAnnual: 0.4,
    propertyInsurancePctAnnual: 0.05,
  },
};
