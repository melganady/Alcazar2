export type ResidencyStatus = "uae-national" | "resident-expat" | "non-resident";
export type PropertyStatus = "ready" | "off-plan";
export type Employment = "salaried" | "self-employed";

/**
 * §8 — every figure lives in the CMS (MortgageConstants global) with an
 * effective date and source note. Nothing here is hard-coded into components;
 * the calculator receives this object from the server.
 */
export type MortgageConstants = {
  effectiveFrom: string;
  sourceNote: string;
  ltv: {
    nationalFirstLe5MPct: number;
    nationalFirstGt5MPct: number;
    expatFirstLe5MPct: number;
    expatFirstGt5MPct: number;
    secondPropertyPct: number;
    nonResidentPct: number; // completed property, lender-dependent 50–60
    offPlanPct: number; // during construction
    firstPropertyThresholdAED: number; // 5,000,000
  };
  dbr: {
    expatPct: number; // 50
    nationalPct: number; // 60
  };
  tenure: {
    maxYears: number; // 25
    maxAgeSalaried: number; // 65
    maxAgeSelfEmployed: number; // 70
  };
  fees: {
    dldTransferPct: number; // 4
    dldAdminAED: number;
    mortgageRegistrationPct: number; // 0.25 of loan
    mortgageRegistrationAdminAED: number;
    bankArrangementPct: number; // ~1 of loan
    valuationMinAED: number;
    valuationMaxAED: number;
    trusteeMinAED: number;
    trusteeMaxAED: number;
    agencyCommissionPct: number; // 2
    lifeInsurancePctAnnual: number; // of loan, banded estimate
    propertyInsurancePctAnnual: number; // of value, banded estimate
  };
};

export type BorrowerInput = {
  propertyPriceAED: number;
  residencyStatus: ResidencyStatus;
  propertyStatus: PropertyStatus;
  isFirstProperty: boolean;
  grossMonthlyIncomeAED: number;
  existingMonthlyDebtAED: number;
  termYears: number;
  interestRatePct: number;
  age?: number;
  employment?: Employment;
};

export type BindingConstraint = "ltv" | "affordability" | "equal";

export type CostLine = {
  key: string;
  amountAED?: number;
  minAED?: number;
  maxAED?: number;
};
