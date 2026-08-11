"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePrefs } from "@/components/primitives/PrefsProvider";
import { Field } from "@/components/primitives/Field";
import { Select } from "@/components/primitives/Select";
import { Toggle } from "@/components/primitives/Toggle";
import { Rule } from "@/components/primitives/Rule";
import {
  amortisationTable,
  maxBorrowing,
  maxTenureYears,
  monthlyRepayment,
  totalCost,
  upfrontCosts,
  valuationGap,
} from "@/lib/mortgage/calc";
import type {
  BorrowerInput,
  Employment,
  MortgageConstants,
  PropertyStatus,
  ResidencyStatus,
} from "@/lib/mortgage/types";
import { conversionNote, formatAED, formatConverted } from "@/lib/currency";
import { requestCalculatorPdf } from "@/lib/actions";
import { track } from "@/lib/analytics";

type Milestone = { label: string; pct: number; trigger: string };

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function Money({ aed, small = false }: { aed: number; small?: boolean }) {
  const { currency } = usePrefs();
  const locale = useLocale();
  const converted = formatConverted(aed, currency, locale);
  return (
    <>
      {formatAED(Math.round(aed), locale)}
      {converted ? (
        <span className={small ? "type-micro ms-1.5 text-midnight/65" : "type-body-s ms-2 text-midnight/65"}>
          {converted}
        </span>
      ) : null}
    </>
  );
}

export function Calculator({
  constants,
  initial,
  projectMilestones,
  projectName,
}: {
  constants: MortgageConstants;
  initial?: Partial<{
    price: number;
    residency: ResidencyStatus;
    propertyStatus: PropertyStatus;
  }>;
  projectMilestones?: Milestone[];
  projectName?: string;
}) {
  const t = useTranslations("mortgage");
  const tp = useTranslations("project");
  const locale = useLocale();
  const { currency } = usePrefs();

  const [price, setPrice] = useState(initial?.price ?? 2_000_000);
  const [residency, setResidency] = useState<ResidencyStatus>(initial?.residency ?? "non-resident");
  const [propertyStatus, setPropertyStatus] = useState<PropertyStatus>(
    initial?.propertyStatus ?? "ready",
  );
  const [isFirstProperty, setIsFirstProperty] = useState(true);
  const [income, setIncome] = useState(50_000);
  const [debts, setDebts] = useState(0);
  const [termYears, setTermYears] = useState(25);
  const [ratePct, setRatePct] = useState(4.25);
  const [depositOverride, setDepositOverride] = useState<number | null>(null);
  const [age, setAge] = useState<number | "">("");
  const [employment, setEmployment] = useState<Employment>("salaried");
  const [valuationPct, setValuationPct] = useState(95);

  // Deep-linkable state (§8) — read once, then mirror into the URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const num = (k: string) => (p.get(k) ? Number(p.get(k)) : undefined);
    if (num("price")) setPrice(num("price")!);
    const res = p.get("residency");
    if (res === "uae-national" || res === "resident-expat" || res === "non-resident") setResidency(res);
    const ps = p.get("propertyStatus");
    if (ps === "ready" || ps === "off-plan") setPropertyStatus(ps);
    if (p.get("first") === "0") setIsFirstProperty(false);
    if (num("income")) setIncome(num("income")!);
    if (num("debts") != null && p.get("debts")) setDebts(num("debts")!);
    if (num("term")) setTermYears(num("term")!);
    if (num("rate")) setRatePct(num("rate")!);
    if (num("age")) setAge(num("age")!);
  }, []);

  const raw: BorrowerInput = useMemo(
    () => ({
      propertyPriceAED: price,
      residencyStatus: residency,
      propertyStatus,
      isFirstProperty,
      grossMonthlyIncomeAED: income,
      existingMonthlyDebtAED: debts,
      termYears,
      interestRatePct: ratePct,
      age: age === "" ? undefined : age,
      employment,
    }),
    [price, residency, propertyStatus, isFirstProperty, income, debts, termYears, ratePct, age, employment],
  );
  // Live recompute, debounced 150ms (§8)
  const input = useDebounced(raw, 150);

  useEffect(() => {
    const p = new URLSearchParams();
    p.set("price", String(input.propertyPriceAED));
    p.set("residency", input.residencyStatus);
    p.set("propertyStatus", input.propertyStatus);
    if (!input.isFirstProperty) p.set("first", "0");
    p.set("income", String(input.grossMonthlyIncomeAED));
    if (input.existingMonthlyDebtAED) p.set("debts", String(input.existingMonthlyDebtAED));
    p.set("term", String(input.termYears));
    p.set("rate", String(input.interestRatePct));
    if (input.age != null) p.set("age", String(input.age));
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, [input]);

  const tenure = maxTenureYears(constants, input);
  const effectiveInput = { ...input, termYears: tenure.years };
  const borrowing = maxBorrowing(constants, effectiveInput);

  const minDeposit = Math.max(0, input.propertyPriceAED - borrowing.loanAED);
  const deposit = Math.min(
    input.propertyPriceAED,
    Math.max(depositOverride ?? minDeposit, minDeposit),
  );
  const loan = Math.max(0, input.propertyPriceAED - deposit);

  const monthly = monthlyRepayment(loan, input.interestRatePct, tenure.years);
  const costs = upfrontCosts(constants, { priceAED: input.propertyPriceAED, loanAED: loan });
  const { totalPaidAED, totalInterestAED } = totalCost(loan, input.interestRatePct, tenure.years);
  const insuranceAnnual =
    (loan * constants.fees.lifeInsurancePctAnnual) / 100 +
    (input.propertyPriceAED * constants.fees.propertyInsurancePctAnnual) / 100;

  const gap = valuationGap({
    priceAED: input.propertyPriceAED,
    handoverLtvPct: borrowing.ltvPct,
    valuationPct,
  });

  const bindingNote =
    borrowing.binding === "ltv"
      ? t("bindingLtv", { pct: borrowing.ltvPct, rule: borrowing.ltvRule })
      : borrowing.binding === "affordability"
        ? t("bindingAffordability", { dbr: residency === "uae-national" ? constants.dbr.nationalPct : constants.dbr.expatPct })
        : t("bindingEqual");

  const [pdfState, pdfAction] = useActionState(requestCalculatorPdf, null);

  // §12 calculator_used — on the settled scenario, with the binding constraint
  useEffect(() => {
    track({
      name: "calculator_used",
      residencyStatus: input.residencyStatus,
      bindingConstraint: borrowing.binding,
      propertyStatus: input.propertyStatus,
    });
  }, [input.residencyStatus, input.propertyStatus, borrowing.binding]);

  const downloadCsv = () => {
    const rows = amortisationTable(loan, input.interestRatePct, tenure.years);
    const head = "month,opening_aed,interest_aed,principal_aed,closing_aed";
    const body = rows
      .map((r) =>
        [r.month, r.openingAED.toFixed(2), r.interestAED.toFixed(2), r.principalAED.toFixed(2), r.closingAED.toFixed(2)].join(","),
      )
      .join("\n");
    const blob = new Blob([`${head}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alcazar-amortisation.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const amortRows = amortisationTable(loan, input.interestRatePct, tenure.years);
  const note = conversionNote(currency);
  const lineLabel: Record<string, string> = {
    deposit: t("lineDeposit"),
    dldTransfer: t("lineDldTransfer"),
    mortgageRegistration: t("lineMortgageRegistration"),
    bankArrangement: t("lineBankArrangement"),
    valuation: t("lineValuation"),
    trustee: t("lineTrustee"),
    agency: t("lineAgency"),
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,24rem)_1fr]">
      {/* Inputs */}
      <div className="flex h-fit flex-col gap-4 border border-rule bg-white p-6">
        <Field
          id="c-price" label={t("price")} type="number" inputMode="numeric" min={200000} step={50000}
          value={price || ""} onChange={(e) => { setPrice(Number(e.target.value)); setDepositOverride(null); }}
        />
        <Select
          id="c-residency" label={t("residency")} value={residency}
          onChange={(e) => setResidency(e.target.value as ResidencyStatus)}
          options={[
            { value: "non-resident", label: locale === "ar" ? "غير مقيم" : "Non-resident" },
            { value: "resident-expat", label: locale === "ar" ? "مقيم (وافد)" : "Resident expat" },
            { value: "uae-national", label: locale === "ar" ? "مواطن إماراتي" : "UAE national" },
          ]}
        />
        <Select
          id="c-status" label={t("propertyStatus")} value={propertyStatus}
          onChange={(e) => setPropertyStatus(e.target.value as PropertyStatus)}
          options={[
            { value: "ready", label: t("ready") },
            { value: "off-plan", label: t("offplan") },
          ]}
        />
        <Toggle id="c-first" checked={isFirstProperty} onChange={setIsFirstProperty} label={t("firstProperty")} />
        <Field
          id="c-income" label={t("income")} type="number" inputMode="numeric" min={0} step={1000}
          value={income || ""} onChange={(e) => setIncome(Number(e.target.value))}
        />
        <Field
          id="c-debts" label={t("debts")} type="number" inputMode="numeric" min={0} step={500}
          value={debts || ""} placeholder="0" onChange={(e) => setDebts(Number(e.target.value))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            id="c-term" label={t("term")} type="number" min={1} max={constants.tenure.maxYears}
            value={termYears || ""} onChange={(e) => setTermYears(Number(e.target.value))}
          />
          <Field
            id="c-rate" label={t("rate")} type="number" min={0} max={12} step={0.05}
            value={ratePct || ""} onChange={(e) => setRatePct(Number(e.target.value))}
          />
        </div>
        <Field
          id="c-deposit" label={t("deposit")} hint={t("depositHint")} type="number" min={minDeposit}
          step={50000} value={Math.round(deposit)}
          onChange={(e) => setDepositOverride(Number(e.target.value))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            id="c-age" label={t("age")} type="number" min={21} max={75}
            value={age} onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
          />
          <Select
            id="c-employment" label={t("employment")} value={employment}
            onChange={(e) => setEmployment(e.target.value as Employment)}
            options={[
              { value: "salaried", label: t("salaried") },
              { value: "self-employed", label: t("selfEmployed") },
            ]}
          />
        </div>
      </div>

      {/* Outputs */}
      <div className="flex flex-col gap-6">
        <div className="border border-rule bg-white p-6">
          <p className="type-eyebrow text-midnight/65">{t("maxBorrowing")}</p>
          <p className="type-display-m mt-1 text-blue">
            <Money aed={borrowing.loanAED} />
          </p>
          <p className="type-body-s mt-2 max-w-xl text-midnight/70">{bindingNote}</p>
          {tenure.ageCapped ? (
            <p className="type-body-s mt-1 text-midnight/70">
              {t("ageCapNote", {
                years: tenure.years,
                maxAge: employment === "self-employed" ? constants.tenure.maxAgeSelfEmployed : constants.tenure.maxAgeSalaried,
              })}
            </p>
          ) : null}
          <div className="mt-5 grid grid-cols-2 gap-5 border-t border-rule pt-5 sm:grid-cols-3">
            <div>
              <p className="type-micro uppercase text-midnight/65">{t("depositRequired")}</p>
              <p className="type-body font-medium text-midnight"><Money aed={deposit} small /></p>
            </div>
            <div>
              <p className="type-micro uppercase text-midnight/65">{t("monthly")}</p>
              <p className="type-body font-medium text-midnight"><Money aed={monthly} small /></p>
            </div>
            <div>
              <p className="type-micro uppercase text-midnight/65">{t("totalOverTerm", { years: tenure.years })}</p>
              <p className="type-body font-medium text-midnight"><Money aed={totalPaidAED} small /></p>
              <p className="type-micro text-midnight/65">
                {t("totalInterest")} <Money aed={totalInterestAED} small />
              </p>
            </div>
          </div>
        </div>

        {/* Upfront costs */}
        <div className="border border-rule bg-white p-6">
          <p className="type-eyebrow text-midnight/65">{t("upfront")}</p>
          <p className="type-display-s mt-1 text-midnight">
            <Money aed={costs.totalMinAED} />
            {costs.totalMaxAED > costs.totalMinAED ? <span className="text-midnight/65"> – <Money aed={costs.totalMaxAED} small /></span> : null}
          </p>
          <ul className="mt-4 flex flex-col divide-y divide-rule/60">
            {costs.lines.map((l) => (
              <li key={l.key} className="flex items-baseline justify-between gap-4 py-2">
                <span className="type-body-s text-midnight/70">{lineLabel[l.key] ?? l.key}</span>
                <span className="type-body-s font-medium text-midnight">
                  {l.amountAED != null ? (
                    <Money aed={l.amountAED} small />
                  ) : (
                    <>
                      <Money aed={l.minAED!} small /> – <Money aed={l.maxAED!} small />
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="type-micro mt-3 text-midnight/65">
            {t("insuranceNote", { amount: formatAED(Math.round(insuranceAnnual), locale) })}
          </p>
        </div>

        {/* Off-plan two-stage mode */}
        {propertyStatus === "off-plan" ? (
          <div className="border border-rule bg-white p-6">
            <p className="type-eyebrow text-midnight/65">{t("offplanTitle")}</p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="type-body-s font-medium text-midnight">{t("offplanDuring")}</p>
                {projectMilestones?.length ? (
                  <ul className="mt-2 flex flex-col divide-y divide-rule/60">
                    {projectMilestones.map((m, i) => (
                      <li key={i} className="flex justify-between gap-3 py-1.5">
                        <span className="type-body-s text-midnight/70">
                          {m.label} · {m.pct}%
                        </span>
                        <span className="type-body-s text-midnight">
                          <Money aed={(price * m.pct) / 100} small />
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="type-body-s mt-2 text-midnight/70">
                    {projectName ?? ""}
                  </p>
                )}
              </div>
              <div>
                <p className="type-body-s font-medium text-midnight">{t("offplanAtHandover")}</p>
                <p className="type-body-s mt-2 text-midnight/70">
                  {t("offplanHandoverNote", { pct: borrowing.ltvPct })}
                </p>
                <div className="mt-3">
                  <Field
                    id="c-valuation" label={t("valuationLabel")} type="number" min={50} max={100}
                    value={valuationPct} onChange={(e) => setValuationPct(Number(e.target.value))}
                  />
                </div>
                {valuationPct < 100 ? (
                  <p className="type-body-s mt-2 text-midnight/70">
                    {t("valuationGapNote", {
                      pct: valuationPct,
                      loan: formatAED(Math.round(gap.actualLoanAED), locale),
                      gap: formatAED(Math.round(gap.extraCashAED), locale),
                    })}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* Amortisation */}
        <details className="border border-rule bg-white">
          <summary className="type-eyebrow cursor-pointer p-6 text-midnight/65">
            {t("amortisation")}
          </summary>
          <div className="px-6 pb-6">
            <button
              type="button"
              onClick={downloadCsv}
              className="type-eyebrow mb-4 border border-blue px-4 py-2 text-blue transition-colors duration-fast ease-brand hover:bg-blue hover:text-sand"
            >
              {t("downloadCsv")}
            </button>
            <div className="max-h-96 overflow-auto">
              <table className="w-full min-w-[32rem] border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-rule">
                    {[t("amMonth"), t("amOpening"), t("amInterest"), t("amPrincipal"), t("amClosing")].map((h) => (
                      <th key={h} className="type-eyebrow py-2 pe-4 text-start text-midnight/65">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {amortRows.map((r) => (
                    <tr key={r.month} className="border-b border-rule/40">
                      <td className="type-body-s py-1.5 pe-4 text-midnight/70">{r.month}</td>
                      <td className="type-body-s py-1.5 pe-4 text-midnight">{Math.round(r.openingAED).toLocaleString()}</td>
                      <td className="type-body-s py-1.5 pe-4 text-midnight">{Math.round(r.interestAED).toLocaleString()}</td>
                      <td className="type-body-s py-1.5 pe-4 text-midnight">{Math.round(r.principalAED).toLocaleString()}</td>
                      <td className="type-body-s py-1.5 text-midnight">{Math.round(r.closingAED).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>

        {/* PDF soft gate — the lead */}
        <div className="border border-rule bg-white p-6">
          <p className="type-display-s text-midnight">{t("pdfTitle")}</p>
          {pdfState?.ok ? (
            <p role="status" className="type-body mt-3 text-midnight/80">{t("pdfSent")}</p>
          ) : (
            <form
              action={pdfAction}
              onSubmit={() => track({ name: "pdf_gated_submit", residencyStatus: residency })}
              className="mt-4 grid gap-4 sm:grid-cols-3"
            >
              <div className="hidden" aria-hidden>
                <input type="text" name="company" tabIndex={-1} autoComplete="off" />
              </div>
              <input type="hidden" name="locale" value={locale} />
              <input
                type="hidden"
                name="scenario"
                value={`price ${input.propertyPriceAED}, ${input.residencyStatus}, ${input.propertyStatus}, loan ${Math.round(loan)}, ${tenure.years}y @ ${input.interestRatePct}%`}
              />
              <input type="hidden" name="residencyStatus" value={residency === "resident-expat" ? "uae-resident" : residency} />
              <Field id="pdf-name" name="name" label={tp("formName")} required />
              <Field id="pdf-email" name="email" type="email" label={tp("formEmail")} required />
              <button
                type="submit"
                className="type-eyebrow self-end bg-blue px-6 py-3 text-sand transition-colors duration-fast ease-brand hover:bg-midnight"
              >
                {t("pdfCta")}
              </button>
            </form>
          )}
        </div>

        <Rule />
        <p className="type-micro max-w-3xl text-midnight/65">{t("disclaimer")}</p>
        <p className="type-micro max-w-3xl text-midnight/65">
          {t("constantsNote", { date: constants.effectiveFrom, source: constants.sourceNote })}
          {note ? ` · ${note}` : ""}
        </p>
      </div>
    </div>
  );
}
