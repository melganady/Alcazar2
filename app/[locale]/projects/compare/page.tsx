import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { getProjectsBySlugs } from "@/lib/projects";
import { formatHandoverOrDash } from "@/lib/format";
import type { Developer } from "@/payload-types";

export const metadata: Metadata = {
  title: "Compare projects",
  robots: { index: false },
};

const SCORE_KEYS = [
  "developerRecord",
  "regulatoryStanding",
  "priceVsComparables",
  "paymentStructure",
  "supplyInWindow",
  "exitTerms",
  "runningCost",
  "unitQuality",
] as const;

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ slugs?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { slugs } = await searchParams;
  const t = await getTranslations("projects");

  const projects = await getProjectsBySlugs(
    (slugs ?? "").split(",").filter(Boolean).slice(0, 3),
  );

  const rows: Array<[string, (p: (typeof projects)[number]) => React.ReactNode]> = [
    [t("from"), (p) => `AED ${p.priceFromAED.toLocaleString()}`],
    [t("comparePricePerSqft"), (p) => (p.pricePerSqftFrom ? `AED ${p.pricePerSqftFrom.toLocaleString()}` : "—")],
    [t("comparePlan"), (p) => p.paymentPlan?.label ?? "—"],
    [t("compareHandover"), (p) => formatHandoverOrDash(p.handoverQuarter, p.handoverYear)],
    [
      t("compareDeveloper"),
      (p) => {
        const d = p.developer && typeof p.developer === "object" ? (p.developer as Developer) : null;
        if (!d) return "—";
        const parts = [d.name];
        if (d.projectsDelivered != null) parts.push(t("compareDelivered", { count: d.projectsDelivered }));
        if (d.averageHandoverSlippageMonths != null)
          parts.push(t("compareSlippage", { months: d.averageHandoverSlippageMonths }));
        return parts.join(" · ");
      },
    ],
    [
      t("compareServiceCharge"),
      (p) =>
        p.serviceChargeEstimateAEDPerSqft
          ? `AED ${p.serviceChargeEstimateAEDPerSqft}/sqft`
          : "—",
    ],
    [
      t("compareExit"),
      (p) =>
        p.assignmentAllowed
          ? t("compareExitAllowed", {
              pct: p.assignmentMinPaidPct ?? 0,
              fee: (p.developerNocFeeAED ?? 0).toLocaleString(),
            })
          : t("compareExitNo"),
    ],
    [
      t("compareScores"),
      (p) => {
        const s = p.alcazarFilterScores;
        if (!s) return "—";
        const total = SCORE_KEYS.reduce((sum, k) => sum + (s[k] ?? 0), 0);
        return `${total} / 40`;
      },
    ],
  ];

  return (
    <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-12 md:px-6">
      <header className="flex flex-col gap-3">
        <Eyebrow>Alcázar</Eyebrow>
        <h1 className="type-display-l text-iron">{t("compareTitle")}</h1>
        {projects.length < 2 ? (
          <p className="type-body-l text-iron/80">{t("compareHint")}</p>
        ) : null}
      </header>

      {projects.length > 0 ? (
        <div className="overflow-x-auto border border-rule bg-linen">
          <table className="w-full min-w-[44rem] border-collapse">
            <thead>
              <tr className="border-b border-rule">
                <th className="w-44 p-4" />
                {projects.map((p) => (
                  <th key={p.id} className="p-4 text-start">
                    <Link href={`/projects/${p.slug}`} className="type-display-s text-iron underline-offset-4 hover:underline">
                      {p.name}
                    </Link>
                    <p className="type-body-s mt-1 font-normal text-iron/80">
                      {p.subCommunity}, {p.region}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, render]) => (
                <tr key={label} className="border-b border-rule/60 align-top">
                  <th className="type-eyebrow p-4 text-start text-iron/80">{label}</th>
                  {projects.map((p) => (
                    <td key={p.id} className="type-body-s p-4 text-iron">
                      {render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="type-body text-iron/80">{t("compareHint")}</p>
      )}

      <Link href="/projects" className="type-eyebrow self-start text-iron/80 hover:underline hover:underline-offset-4">
        ← {t("title")}
      </Link>
    </div>
  );
}
