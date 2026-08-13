import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { getPayloadClient } from "@/lib/payload";
import { loadMortgageConstants } from "@/lib/mortgage/loadConstants";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Financing an off-plan property in the UAE — the two-stage reality",
  description:
    "Off-plan is financed in two stages: developer instalments during construction, then a mortgage at handover. LTV caps, the valuation gap, and which lenders play.",
};

export default async function OffPlanFinancePage({
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
      where: { and: [{ onPanel: { equals: true } }, { financesOffplan: { equals: true } }] },
      sort: "name",
      limit: 20,
    }),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Alcázar · Off-plan finance"
        title="Off-plan is financed twice"
        support="Stage one: the developer's instalments during construction, from your own funds. Stage two: the mortgage at handover. Most buyers plan only stage two — and get surprised by stage one. Here is the whole picture."
        compact
      />
      <div className="mx-auto flex max-w-container flex-col gap-12 px-4 py-12 md:px-6">
      <section className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-3 border border-rule bg-linen p-6">
          <p className="type-eyebrow text-iron/80">Stage 1 · During construction</p>
          <h2 className="type-display-s text-iron">Developer instalments, self-funded</h2>
          <p className="type-body-s text-iron/80">
            The payment plan — 60/40, 80/20, whatever the project sets — runs on the
            developer&rsquo;s milestones. Bank finance during construction is capped at{" "}
            {constants.ltv.offPlanPct}% and few lenders offer it at all; the practical route is
            paying the construction instalments in cash and borrowing at handover.
          </p>
        </div>
        <div className="flex flex-col gap-3 border border-rule bg-linen p-6">
          <p className="type-eyebrow text-iron/80">Stage 2 · At handover</p>
          <h2 className="type-display-s text-iron">The mortgage starts — against a valuation</h2>
          <p className="type-body-s text-iron/80">
            At handover the unit is completed property: residents borrow at their normal caps,
            non-residents at up to {constants.ltv.nonResidentPct}%. The catch is the{" "}
            <strong className="font-medium">valuation gap</strong> — the bank lends against its
            valuation, not your purchase price. If it values at 95%, the missing 5% of expected
            loan becomes cash you bring on the day.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="type-display-m text-iron">Lenders that finance off-plan during construction</h2>
        {lendersRes.docs.length > 0 ? (
          <ul className="flex max-w-2xl flex-col divide-y divide-rule border border-rule bg-linen">
            {lendersRes.docs.map((l) => (
              <li key={l.id} className="flex items-baseline justify-between gap-4 p-4">
                <span className="type-body-s font-medium text-iron">{l.name}</span>
                <span className="type-body-s text-iron/80">
                  up to {constants.ltv.offPlanPct}% during construction · {l.indicativeFixedRatePct}%
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="type-micro max-w-3xl text-iron/80">
          Caps effective {constants.effectiveFrom}. {constants.sourceNote}
        </p>
      </section>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/mortgages/calculator?propertyStatus=off-plan"
          className="type-eyebrow bg-iron px-6 py-3.5 text-ash transition-colors duration-fast ease-brand hover:bg-iron/85"
        >
          Model an off-plan purchase
        </Link>
        <Link
          href="/projects?mortgageable=yes"
          className="type-eyebrow border border-iron px-6 py-3.5 text-iron transition-colors duration-fast ease-brand hover:bg-iron hover:text-ash"
        >
          See mortgageable projects
        </Link>
      </div>

      <p className="type-micro max-w-3xl text-iron/80">
        Indicative only — not an offer of finance. Lender criteria and rates vary and approval is
        not guaranteed. Alcázar acts as an intermediary and is not a lender. Off-plan property
        carries construction, delivery, market and liquidity risk; values can fall.
      </p>
      </div>
    </>
  );
}
