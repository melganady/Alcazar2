import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { Calculator } from "@/components/mortgage/Calculator";
import { loadMortgageConstants } from "@/lib/mortgage/loadConstants";
import { getProjectBySlug } from "@/lib/projects";
import type { PropertyStatus, ResidencyStatus } from "@/lib/mortgage/types";

export const metadata: Metadata = {
  title: "UAE mortgage calculator — residents and non-residents",
  description:
    "Maximum borrowing, deposit, monthly repayment and total upfront cash for a UAE property purchase — with the binding constraint named, for residents and non-residents.",
};

export default async function CalculatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    price?: string;
    residency?: string;
    propertyStatus?: string;
    project?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("mortgage");

  const constants = await loadMortgageConstants();

  // Arriving from a project page pre-fills the scenario (§8 off-plan mode)
  const project = sp.project ? await getProjectBySlug(sp.project) : null;
  const milestones =
    project?.paymentPlan?.milestones?.map((m) => ({
      label: m.label,
      pct: m.pct,
      trigger: m.trigger,
    })) ?? undefined;

  const residency = ["uae-national", "resident-expat", "non-resident"].includes(sp.residency ?? "")
    ? (sp.residency as ResidencyStatus)
    : undefined;
  const propertyStatus =
    sp.propertyStatus === "ready" || sp.propertyStatus === "off-plan"
      ? (sp.propertyStatus as PropertyStatus)
      : project
        ? "off-plan"
        : undefined;

  return (
    <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-12 md:px-6">
      <header className="flex flex-col gap-3">
        <Eyebrow>Alcázar · {project ? project.name : "UAE"}</Eyebrow>
        <h1 className="type-display-l text-iron">{t("calcTitle")}</h1>
        <p className="type-body-l max-w-2xl text-iron/80">{t("calcIntro")}</p>
      </header>
      <Calculator
        constants={constants}
        initial={{
          price: sp.price ? Number(sp.price) : project?.priceFromAED,
          residency,
          propertyStatus,
        }}
        projectMilestones={milestones}
        projectName={project?.name}
      />
    </div>
  );
}
