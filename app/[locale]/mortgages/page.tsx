import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { getPayloadClient } from "@/lib/payload";
import { loadMortgageConstants } from "@/lib/mortgage/loadConstants";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Mortgages in the UAE — residents and non-residents",
  description:
    "Financing for UAE residents and non-residents: LTV caps, lender comparison, off-plan finance, and a calculator that names the constraint that binds you.",
};

/*
 * English-first content per the confirmed launch plan; chrome is localised,
 * long-form body copy ships in Arabic with the content phase.
 */
export default async function MortgagesPage({
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
      where: { onPanel: { equals: true } },
      sort: "name",
      limit: 20,
    }),
  ]);
  const lenders = lendersRes.docs;

  const CARDS = [
    {
      href: "/mortgages/calculator",
      title: "Calculator",
      body: "Maximum borrowing, deposit, monthly repayment, total upfront cash. Named constraint, no submit button.",
    },
    {
      href: "/mortgages/non-residents",
      title: "Non-resident financing",
      body: `Up to ${constants.ltv.nonResidentPct}% LTV on completed property without UAE residency. Eligibility, documents, timeline.`,
    },
    {
      href: "/mortgages/off-plan",
      title: "Off-plan finance",
      body: "Two stages: developer instalments during construction, mortgage at handover. The valuation gap, explained.",
    },
  ] as const;

  return (
    <div className="mx-auto flex max-w-container flex-col gap-12 px-4 py-12 md:px-6">
      <header className="flex flex-col gap-3">
        <Eyebrow>Alcázar · Mortgage advisory</Eyebrow>
        <h1 className="type-display-l text-iron">Financing, without the fog</h1>
        <p className="type-body-l max-w-2xl text-iron/80">
          Residents and non-residents. We arrange, we do not lend — and we show
          you which constraint actually limits what you can borrow before any
          bank does.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group flex flex-col gap-3 border border-rule bg-linen p-6 transition-colors duration-fast ease-brand hover:border-pine"
          >
            <h2 className="type-display-s text-iron group-hover:underline group-hover:underline-offset-4">{c.title}</h2>
            <p className="type-body-s text-iron/80">{c.body}</p>
          </Link>
        ))}
      </div>

      <section className="flex flex-col gap-5">
        <h2 className="type-display-m text-iron">Lender panel</h2>
        <div className="overflow-x-auto border border-rule bg-linen">
          <table className="w-full min-w-[44rem] border-collapse">
            <thead>
              <tr className="border-b-2 border-pine">
                {["Lender", "Max LTV resident", "Max LTV non-resident", "Finances off-plan", "Indicative fixed rate", "Fixed period"].map((h) => (
                  <th key={h} className="type-eyebrow p-3 text-start text-iron/80">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lenders.map((l) => (
                <tr key={l.id} className="border-b border-rule/60">
                  <td className="type-body-s p-3 font-medium text-iron">{l.name}</td>
                  <td className="type-body-s p-3 text-iron">{l.maxLtvResidentPct}%</td>
                  <td className="type-body-s p-3 text-iron">{l.maxLtvNonResidentPct}%</td>
                  <td className="type-body-s p-3 text-iron">{l.financesOffplan ? "Yes" : "No"}</td>
                  <td className="type-body-s p-3 text-iron">{l.indicativeFixedRatePct}%</td>
                  <td className="type-body-s p-3 text-iron">{l.fixedPeriodYears} years</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="type-micro max-w-3xl text-iron/80">
          Rates effective {lenders[0]?.ratesEffectiveFrom?.slice(0, 10) ?? constants.effectiveFrom}.
          Indicative only; lender criteria vary and approval is not guaranteed. Alcázar acts as an
          intermediary and is not a lender.
        </p>
      </section>
    </div>
  );
}
