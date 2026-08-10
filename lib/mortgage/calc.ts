import type {
  BindingConstraint,
  BorrowerInput,
  CostLine,
  MortgageConstants,
} from "./types";

/**
 * Pure functions only — no formatting, no i18n, no component logic (§8).
 * All money values are AED. Percentages are whole numbers (80 = 80%).
 */

export function maxLtvPct(
  c: MortgageConstants,
  input: Pick<
    BorrowerInput,
    "residencyStatus" | "propertyStatus" | "isFirstProperty" | "propertyPriceAED"
  >,
): { pct: number; rule: string } {
  if (input.propertyStatus === "off-plan") {
    return { pct: c.ltv.offPlanPct, rule: "off-plan-during-construction" };
  }
  if (input.residencyStatus === "non-resident") {
    return { pct: c.ltv.nonResidentPct, rule: "non-resident-completed" };
  }
  if (!input.isFirstProperty) {
    return { pct: c.ltv.secondPropertyPct, rule: "second-or-investment-property" };
  }
  const le5M = input.propertyPriceAED <= c.ltv.firstPropertyThresholdAED;
  if (input.residencyStatus === "uae-national") {
    return le5M
      ? { pct: c.ltv.nationalFirstLe5MPct, rule: "national-first-le-5m" }
      : { pct: c.ltv.nationalFirstGt5MPct, rule: "national-first-gt-5m" };
  }
  return le5M
    ? { pct: c.ltv.expatFirstLe5MPct, rule: "expat-first-le-5m" }
    : { pct: c.ltv.expatFirstGt5MPct, rule: "expat-first-gt-5m" };
}

export function dbrCapPct(c: MortgageConstants, residency: BorrowerInput["residencyStatus"]): number {
  return residency === "uae-national" ? c.dbr.nationalPct : c.dbr.expatPct;
}

/** Standard annuity: P × r / (1 − (1+r)^−n). Zero-rate degenerates to linear. */
export function monthlyRepayment(
  principalAED: number,
  annualRatePct: number,
  termYears: number,
): number {
  const n = Math.round(termYears * 12);
  if (n <= 0 || principalAED <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principalAED / n;
  return (principalAED * r) / (1 - Math.pow(1 + r, -n));
}

/** Largest loan whose repayment fits inside the DBR headroom. */
export function maxLoanByDbr(
  c: MortgageConstants,
  input: Pick<
    BorrowerInput,
    | "residencyStatus"
    | "grossMonthlyIncomeAED"
    | "existingMonthlyDebtAED"
    | "interestRatePct"
    | "termYears"
  >,
): number {
  const cap = dbrCapPct(c, input.residencyStatus) / 100;
  const headroom =
    input.grossMonthlyIncomeAED * cap - input.existingMonthlyDebtAED;
  if (headroom <= 0) return 0;
  const n = Math.round(input.termYears * 12);
  const r = input.interestRatePct / 100 / 12;
  if (r === 0) return headroom * n;
  return (headroom * (1 - Math.pow(1 + r, -n))) / r;
}

/** Tenure after the age-at-maturity rule (§8; age optional — see phase note). */
export function maxTenureYears(
  c: MortgageConstants,
  input: Pick<BorrowerInput, "termYears" | "age" | "employment">,
): { years: number; ageCapped: boolean } {
  let cap = c.tenure.maxYears;
  let byAgeRule = false;
  if (input.age != null) {
    const maxAge =
      input.employment === "self-employed"
        ? c.tenure.maxAgeSelfEmployed
        : c.tenure.maxAgeSalaried;
    const byAge = Math.max(0, maxAge - input.age);
    if (byAge < cap) {
      cap = byAge;
      byAgeRule = true;
    }
  }
  const years = Math.min(input.termYears, cap);
  return { years, ageCapped: byAgeRule && input.termYears > cap };
}

/**
 * §8 output 1 — min(LTV ceiling × price, DBR affordability), and which
 * constraint binds. "The insight buyers never get elsewhere."
 */
export function maxBorrowing(
  c: MortgageConstants,
  input: BorrowerInput,
): {
  loanAED: number;
  binding: BindingConstraint;
  ltvPct: number;
  ltvRule: string;
  ltvLoanAED: number;
  dbrLoanAED: number;
} {
  const { pct, rule } = maxLtvPct(c, input);
  const ltvLoan = (input.propertyPriceAED * pct) / 100;
  const dbrLoan = maxLoanByDbr(c, input);
  const loan = Math.min(ltvLoan, dbrLoan);
  const binding: BindingConstraint =
    Math.round(ltvLoan) === Math.round(dbrLoan)
      ? "equal"
      : ltvLoan < dbrLoan
        ? "ltv"
        : "affordability";
  return {
    loanAED: Math.max(0, loan),
    binding,
    ltvPct: pct,
    ltvRule: rule,
    ltvLoanAED: ltvLoan,
    dbrLoanAED: Math.max(0, dbrLoan),
  };
}

/** §8 output 4 — itemised upfront cash. Banded lines carry min/max. */
export function upfrontCosts(
  c: MortgageConstants,
  { priceAED, loanAED }: { priceAED: number; loanAED: number },
): { lines: CostLine[]; totalMinAED: number; totalMaxAED: number } {
  const f = c.fees;
  const lines: CostLine[] = [
    { key: "deposit", amountAED: Math.max(0, priceAED - loanAED) },
    { key: "dldTransfer", amountAED: (priceAED * f.dldTransferPct) / 100 + f.dldAdminAED },
    ...(loanAED > 0
      ? [
          {
            key: "mortgageRegistration",
            amountAED:
              (loanAED * f.mortgageRegistrationPct) / 100 +
              f.mortgageRegistrationAdminAED,
          },
          { key: "bankArrangement", amountAED: (loanAED * f.bankArrangementPct) / 100 },
          { key: "valuation", minAED: f.valuationMinAED, maxAED: f.valuationMaxAED },
        ]
      : []),
    { key: "trustee", minAED: f.trusteeMinAED, maxAED: f.trusteeMaxAED },
    { key: "agency", amountAED: (priceAED * f.agencyCommissionPct) / 100 },
  ];
  const totalMinAED = lines.reduce((s, l) => s + (l.amountAED ?? l.minAED ?? 0), 0);
  const totalMaxAED = lines.reduce((s, l) => s + (l.amountAED ?? l.maxAED ?? 0), 0);
  return { lines, totalMinAED, totalMaxAED };
}

/** §8 output 5 — cost over the full term. */
export function totalCost(
  principalAED: number,
  annualRatePct: number,
  termYears: number,
): { totalPaidAED: number; totalInterestAED: number } {
  const monthly = monthlyRepayment(principalAED, annualRatePct, termYears);
  const totalPaid = monthly * Math.round(termYears * 12);
  return { totalPaidAED: totalPaid, totalInterestAED: totalPaid - principalAED };
}

/**
 * §8 output 6 — off-plan valuation gap: if the bank values the unit at
 * valuationPct of the purchase price, the loan shrinks and the buyer bridges
 * the difference in cash at handover.
 */
export function valuationGap(
  {
    priceAED,
    handoverLtvPct,
    valuationPct,
  }: { priceAED: number; handoverLtvPct: number; valuationPct: number },
): { expectedLoanAED: number; actualLoanAED: number; extraCashAED: number } {
  const expected = (priceAED * handoverLtvPct) / 100;
  const actual = (priceAED * (valuationPct / 100) * handoverLtvPct) / 100;
  return {
    expectedLoanAED: expected,
    actualLoanAED: actual,
    extraCashAED: Math.max(0, expected - actual),
  };
}

export type AmortisationRow = {
  month: number;
  openingAED: number;
  interestAED: number;
  principalAED: number;
  closingAED: number;
};

/** §8 output 7 — full monthly schedule. */
export function amortisationTable(
  principalAED: number,
  annualRatePct: number,
  termYears: number,
): AmortisationRow[] {
  const n = Math.round(termYears * 12);
  const r = annualRatePct / 100 / 12;
  const pay = monthlyRepayment(principalAED, annualRatePct, termYears);
  const rows: AmortisationRow[] = [];
  let balance = principalAED;
  for (let m = 1; m <= n; m++) {
    const interest = balance * r;
    const principal = m === n ? balance : pay - interest;
    const closing = balance - principal;
    rows.push({
      month: m,
      openingAED: balance,
      interestAED: interest,
      principalAED: principal,
      closingAED: Math.max(0, closing),
    });
    balance = closing;
  }
  return rows;
}
