import { describe, expect, it } from "vitest";
import {
  amortisationTable,
  dbrCapPct,
  maxBorrowing,
  maxLoanByDbr,
  maxLtvPct,
  maxTenureYears,
  monthlyRepayment,
  totalCost,
  upfrontCosts,
  valuationGap,
} from "./calc";
import { DEFAULT_MORTGAGE_CONSTANTS as C } from "./defaults";
import type { BorrowerInput } from "./types";

const base: BorrowerInput = {
  propertyPriceAED: 2_000_000,
  residencyStatus: "resident-expat",
  propertyStatus: "ready",
  isFirstProperty: true,
  grossMonthlyIncomeAED: 60_000,
  existingMonthlyDebtAED: 0,
  termYears: 25,
  interestRatePct: 4.25,
};

describe("maxLtvPct — every band in the §8 table", () => {
  it("UAE national, first property ≤ 5M → 85%", () => {
    expect(
      maxLtvPct(C, { ...base, residencyStatus: "uae-national" }).pct,
    ).toBe(85);
  });
  it("UAE national, first property > 5M → 75%", () => {
    expect(
      maxLtvPct(C, {
        ...base,
        residencyStatus: "uae-national",
        propertyPriceAED: 6_000_000,
      }).pct,
    ).toBe(75);
  });
  it("resident expat, first property ≤ 5M → 80%", () => {
    expect(maxLtvPct(C, base).pct).toBe(80);
  });
  it("resident expat, first property exactly 5M stays in the ≤5M band", () => {
    expect(maxLtvPct(C, { ...base, propertyPriceAED: 5_000_000 }).pct).toBe(80);
  });
  it("resident expat, first property > 5M → 70%", () => {
    expect(maxLtvPct(C, { ...base, propertyPriceAED: 5_000_001 }).pct).toBe(70);
  });
  it("second / investment property → 60% regardless of price", () => {
    expect(maxLtvPct(C, { ...base, isFirstProperty: false }).pct).toBe(60);
    expect(
      maxLtvPct(C, {
        ...base,
        isFirstProperty: false,
        residencyStatus: "uae-national",
        propertyPriceAED: 9_000_000,
      }).pct,
    ).toBe(60);
  });
  it("non-resident, completed property → 60%", () => {
    expect(maxLtvPct(C, { ...base, residencyStatus: "non-resident" }).pct).toBe(60);
  });
  it("off-plan during construction → 50% for every residency", () => {
    for (const residencyStatus of ["uae-national", "resident-expat", "non-resident"] as const) {
      expect(
        maxLtvPct(C, { ...base, residencyStatus, propertyStatus: "off-plan" }).pct,
      ).toBe(50);
    }
  });
});

describe("dbrCapPct — both caps", () => {
  it("expat and non-resident → 50%", () => {
    expect(dbrCapPct(C, "resident-expat")).toBe(50);
    expect(dbrCapPct(C, "non-resident")).toBe(50);
  });
  it("UAE national → 60%", () => {
    expect(dbrCapPct(C, "uae-national")).toBe(60);
  });
});

describe("monthlyRepayment", () => {
  it("matches the annuity formula (1M @ 4.25% / 25y ≈ 5,417/mo)", () => {
    const pay = monthlyRepayment(1_000_000, 4.25, 25);
    expect(pay).toBeGreaterThan(5_410);
    expect(pay).toBeLessThan(5_425);
  });
  it("zero interest degenerates to straight-line", () => {
    expect(monthlyRepayment(1_200_000, 0, 25)).toBeCloseTo(4_000, 5);
  });
  it("zero principal or term → 0", () => {
    expect(monthlyRepayment(0, 4, 25)).toBe(0);
    expect(monthlyRepayment(1_000_000, 4, 0)).toBe(0);
  });
});

describe("maxLoanByDbr", () => {
  it("existing debt eats the headroom", () => {
    const withDebt = maxLoanByDbr(C, { ...base, existingMonthlyDebtAED: 10_000 });
    const without = maxLoanByDbr(C, base);
    expect(withDebt).toBeLessThan(without);
  });
  it("no headroom → 0", () => {
    expect(
      maxLoanByDbr(C, { ...base, grossMonthlyIncomeAED: 10_000, existingMonthlyDebtAED: 6_000 }),
    ).toBe(0);
  });
  it("national 60% cap borrows more than expat 50% on the same income", () => {
    const expat = maxLoanByDbr(C, base);
    const national = maxLoanByDbr(C, { ...base, residencyStatus: "uae-national" });
    expect(national).toBeGreaterThan(expat);
  });
  it("round-trips with monthlyRepayment at the DBR ceiling", () => {
    const loan = maxLoanByDbr(C, base);
    const pay = monthlyRepayment(loan, base.interestRatePct, base.termYears);
    expect(pay).toBeCloseTo(base.grossMonthlyIncomeAED * 0.5, 0);
  });
});

describe("maxBorrowing — binding-constraint logic", () => {
  it("high income → LTV binds, and says so", () => {
    const r = maxBorrowing(C, { ...base, grossMonthlyIncomeAED: 200_000 });
    expect(r.binding).toBe("ltv");
    expect(r.loanAED).toBe(1_600_000); // 80% of 2M
    expect(r.ltvRule).toBe("expat-first-le-5m");
  });
  it("modest income → affordability binds, and says so", () => {
    const r = maxBorrowing(C, { ...base, grossMonthlyIncomeAED: 12_000 });
    expect(r.binding).toBe("affordability");
    expect(r.loanAED).toBeLessThan(1_600_000);
    expect(r.loanAED).toBeCloseTo(r.dbrLoanAED, 5);
  });
  it("off-plan halves the LTV loan", () => {
    const r = maxBorrowing(C, {
      ...base,
      propertyStatus: "off-plan",
      grossMonthlyIncomeAED: 200_000,
    });
    expect(r.loanAED).toBe(1_000_000); // 50% of 2M
  });
  it("zero affordability floors at 0, not negative", () => {
    const r = maxBorrowing(C, {
      ...base,
      grossMonthlyIncomeAED: 5_000,
      existingMonthlyDebtAED: 9_000,
    });
    expect(r.loanAED).toBe(0);
  });
});

describe("maxTenureYears — age at maturity", () => {
  it("caps at 25 years with no age given", () => {
    expect(maxTenureYears(C, { termYears: 30 }).years).toBe(25);
  });
  it("salaried 50-year-old caps at 15 years and reports it", () => {
    const r = maxTenureYears(C, { termYears: 25, age: 50, employment: "salaried" });
    expect(r.years).toBe(15);
    expect(r.ageCapped).toBe(true);
  });
  it("self-employed 50-year-old gets 20 years (maturity 70)", () => {
    const r = maxTenureYears(C, { termYears: 25, age: 50, employment: "self-employed" });
    expect(r.years).toBe(20);
    expect(r.ageCapped).toBe(true);
  });
  it("young borrower asking a short term is not age-capped", () => {
    const r = maxTenureYears(C, { termYears: 20, age: 30, employment: "salaried" });
    expect(r.years).toBe(20);
    expect(r.ageCapped).toBe(false);
  });
});

describe("upfrontCosts", () => {
  it("itemises deposit, DLD 4%, registration 0.25%, arrangement 1%, agency 2%", () => {
    const { lines } = upfrontCosts(C, { priceAED: 2_000_000, loanAED: 1_600_000 });
    const byKey = Object.fromEntries(lines.map((l) => [l.key, l]));
    expect(byKey.deposit.amountAED).toBe(400_000);
    expect(byKey.dldTransfer.amountAED).toBe(80_580); // 4% + 580
    expect(byKey.mortgageRegistration.amountAED).toBe(4_290); // 0.25% + 290
    expect(byKey.bankArrangement.amountAED).toBe(16_000);
    expect(byKey.agency.amountAED).toBe(40_000);
    expect(byKey.valuation.minAED).toBe(2_500);
  });
  it("cash purchase drops the loan-linked lines", () => {
    const { lines } = upfrontCosts(C, { priceAED: 2_000_000, loanAED: 0 });
    const keys = lines.map((l) => l.key);
    expect(keys).not.toContain("mortgageRegistration");
    expect(keys).not.toContain("bankArrangement");
    expect(lines.find((l) => l.key === "deposit")?.amountAED).toBe(2_000_000);
  });
});

describe("totalCost", () => {
  it("total interest = payments − principal", () => {
    const { totalPaidAED, totalInterestAED } = totalCost(1_600_000, 4.25, 25);
    expect(totalPaidAED - totalInterestAED).toBeCloseTo(1_600_000, 0);
    expect(totalInterestAED).toBeGreaterThan(0);
  });
});

describe("valuationGap — §8 off-plan mode", () => {
  it("bank valuing at 90% of price forces the gap into cash", () => {
    const r = valuationGap({ priceAED: 2_000_000, handoverLtvPct: 60, valuationPct: 90 });
    expect(r.expectedLoanAED).toBe(1_200_000);
    expect(r.actualLoanAED).toBe(1_080_000);
    expect(r.extraCashAED).toBe(120_000);
  });
  it("valuation at par → no gap", () => {
    expect(
      valuationGap({ priceAED: 2_000_000, handoverLtvPct: 60, valuationPct: 100 }).extraCashAED,
    ).toBe(0);
  });
});

describe("amortisationTable", () => {
  it("closes to zero on the final month and sums interest correctly", () => {
    const rows = amortisationTable(1_600_000, 4.25, 25);
    expect(rows).toHaveLength(300);
    expect(rows[299].closingAED).toBeCloseTo(0, 4);
    const totalInterest = rows.reduce((s, r) => s + r.interestAED, 0);
    const { totalInterestAED } = totalCost(1_600_000, 4.25, 25);
    expect(totalInterest).toBeCloseTo(totalInterestAED, 0);
  });
});
