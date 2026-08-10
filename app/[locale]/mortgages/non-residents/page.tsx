import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { CropMarks } from "@/components/primitives/CropMarks";
import { getPayloadClient } from "@/lib/payload";
import { loadMortgageConstants } from "@/lib/mortgage/loadConstants";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Non-resident mortgages in Dubai and the UAE — LTV, documents, timeline",
  description:
    "How non-residents finance UAE property: up to 60% LTV on completed homes, eligibility, the exact document checklist, lender comparison, and a realistic timeline.",
};

const FAQ = [
  {
    q: "Can non-residents get a mortgage in the UAE?",
    a: "Yes. Several UAE banks lend to non-residents against completed property, typically at 50–60% loan-to-value, subject to income evidence from your home country.",
  },
  {
    q: "What deposit does a non-resident need?",
    a: "Plan for 40–50% of the purchase price plus roughly 8% in fees. On an AED 2,000,000 apartment that is about AED 800,000–1,000,000 down plus AED 160,000 in costs.",
  },
  {
    q: "Can a non-resident finance an off-plan purchase?",
    a: "Rarely during construction. The standard route is to self-fund the developer's instalments and mortgage the unit at handover, when it becomes a completed property.",
  },
  {
    q: "How long does approval take?",
    a: "Pre-approval typically takes 5–10 working days once documents are complete; final offer and disbursal another 2–3 weeks around valuation and transfer.",
  },
] as const;

export default async function NonResidentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const payload = await getPayloadClient();
  const [constants, lendersRes] = await Promise.all([
    loadMortgageConstants(),
    payload.find({
      collection: "lenders",
      where: { and: [{ onPanel: { equals: true } }, { maxLtvNonResidentPct: { greater_than: 0 } }] },
      sort: "-maxLtvNonResidentPct",
      limit: 20,
    }),
  ]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const DOCS = [
    "Passport copy",
    "Proof of address in your country of residence",
    "6 months of personal bank statements",
    "Salary certificate or 2 years of audited financials if self-employed",
    "Existing liabilities statement",
    "Property details and signed MOU once under offer",
  ];

  const STEPS = [
    ["Pre-approval", "5–10 working days. Income assessed, indicative terms issued. No property required yet."],
    ["Offer + valuation", "1–2 weeks. Bank values the unit; the loan is set against the lower of price and valuation."],
    ["Final offer letter", "Days. Rate, term and conditions fixed in writing."],
    ["Transfer at the trustee office", "1 day. DLD transfer, mortgage registration, keys."],
  ] as const;

  return (
    <div className="mx-auto flex max-w-container flex-col gap-12 px-4 py-12 md:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <header className="flex flex-col gap-3">
        <Eyebrow>Alcázar · Non-resident financing</Eyebrow>
        <h1 className="type-display-l text-blue">
          You do not need a UAE visa to hold a UAE mortgage
        </h1>
        <p className="type-body-l max-w-2xl text-midnight/80">
          Banks here lend to non-residents at up to {constants.ltv.nonResidentPct}% of a completed
          property&rsquo;s value. The process is document-driven and predictable — if you know the
          sequence. This is the sequence.
        </p>
      </header>

      {/* Eligibility table */}
      <section className="flex flex-col gap-5">
        <h2 className="type-display-m text-midnight">What the caps allow</h2>
        <div className="overflow-x-auto border border-rule bg-white">
          <table className="w-full min-w-[36rem] border-collapse">
            <thead>
              <tr className="border-b border-rule">
                {["Scenario", "Max LTV", "Deposit from"].map((h) => (
                  <th key={h} className="type-eyebrow p-3 text-start text-midnight/60">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Completed property, non-resident", `${constants.ltv.nonResidentPct}% (lender-dependent, 50–60%)`, `${100 - constants.ltv.nonResidentPct}%`],
                ["Off-plan during construction", `${constants.ltv.offPlanPct}%`, `${100 - constants.ltv.offPlanPct}% — usually self-funded instead`],
                ["Resident expat, first property ≤ AED 5M (for comparison)", `${constants.ltv.expatFirstLe5MPct}%`, `${100 - constants.ltv.expatFirstLe5MPct}%`],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-rule/60">
                  {row.map((cell, i) => (
                    <td key={i} className={`type-body-s p-3 ${i === 0 ? "font-medium" : ""} text-midnight`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="type-micro max-w-3xl text-midnight/50">
          Caps effective {constants.effectiveFrom}. {constants.sourceNote}
        </p>
      </section>

      {/* Documents */}
      <section className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="type-display-m text-midnight">The document checklist</h2>
          <ul className="flex flex-col divide-y divide-rule border border-rule bg-white">
            {DOCS.map((d) => (
              <li key={d} className="type-body-s p-3 text-midnight">{d}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="type-display-m text-midnight">The timeline</h2>
          <ol className="flex flex-col divide-y divide-rule border border-rule bg-white">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="flex gap-4 p-4">
                <span className="type-display-s text-midnight/40">{i + 1}</span>
                <div>
                  <p className="type-body-s font-medium text-midnight">{title}</p>
                  <p className="type-body-s text-midnight/70">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Lender comparison */}
      <section className="flex flex-col gap-5">
        <h2 className="type-display-m text-midnight">Lenders that take non-residents</h2>
        <div className="overflow-x-auto border border-rule bg-white">
          <table className="w-full min-w-[36rem] border-collapse">
            <thead>
              <tr className="border-b border-rule">
                {["Lender", "Max LTV non-resident", "Min income (USD/mo)", "Indicative rate"].map((h) => (
                  <th key={h} className="type-eyebrow p-3 text-start text-midnight/60">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lendersRes.docs.map((l) => (
                <tr key={l.id} className="border-b border-rule/60">
                  <td className="type-body-s p-3 font-medium text-midnight">{l.name}</td>
                  <td className="type-body-s p-3 text-midnight">{l.maxLtvNonResidentPct}%</td>
                  <td className="type-body-s p-3 text-midnight">
                    {l.minMonthlyIncomeNonResidentUSD?.toLocaleString() ?? "—"}
                  </td>
                  <td className="type-body-s p-3 text-midnight">{l.indicativeFixedRatePct}% / {l.fixedPeriodYears}y fixed</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-5">
        <h2 className="type-display-m text-midnight">Questions we answer daily</h2>
        <div className="flex flex-col divide-y divide-rule border border-rule bg-white">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="type-body cursor-pointer font-medium text-midnight transition-colors duration-fast ease-brand hover:text-blue">
                {f.q}
              </summary>
              <p className="type-body mt-3 max-w-3xl text-midnight/80">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <CropMarks className="self-start">
        <div className="flex flex-col items-start gap-4 bg-sand p-8">
          <p className="type-display-s max-w-xl text-midnight">
            Model your exact scenario — deposit, monthly, and the constraint that binds you.
          </p>
          <Link
            href="/mortgages/calculator?residency=non-resident"
            className="type-eyebrow bg-blue px-6 py-3.5 text-sand transition-colors duration-fast ease-brand hover:bg-midnight"
          >
            Open the calculator
          </Link>
        </div>
      </CropMarks>

      <p className="type-micro max-w-3xl text-midnight/50">
        Indicative only — not an offer of finance. Lender criteria and rates vary and approval is
        not guaranteed. Alcázar acts as an intermediary and is not a lender.
      </p>
    </div>
  );
}
