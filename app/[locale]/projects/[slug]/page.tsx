import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { CropMarks } from "@/components/primitives/CropMarks";
import { Field } from "@/components/primitives/Field";
import { Select } from "@/components/primitives/Select";
import { ProjectCard } from "@/components/project/ProjectCard";
import { CompareProvider } from "@/components/project/CompareProvider";
import { PriceDisplay } from "@/components/project/PriceDisplay";
import { AreaDisplay } from "@/components/project/AreaDisplay";
import { PaymentPlanVisualiser } from "@/components/project/PaymentPlanVisualiser";
import { SentBanner } from "@/components/project/SentBanner";
import { FilterScoreRow } from "@/components/project/FilterScoreRow";
import {
  getAllProjectSlugs,
  getProjectBySlug,
  getSimilarProjects,
  getSupplyInWindow,
} from "@/lib/projects";
import { getPayloadClient } from "@/lib/payload";
import { depositFor, INDICATIVE_LTV } from "@/lib/mortgage/indicative";
import { createLead } from "@/lib/actions";
import { formatBedrooms } from "@/lib/format";
import type { Agent, Developer, Lender, Project } from "@/payload-types";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  // §10 title pattern
  return {
    title: `${project.name}, ${project.subCommunity} — ${project.paymentPlan?.label} Payment Plan, Handover ${project.handoverQuarter} ${project.handoverYear}`,
    description:
      project.seo?.description ??
      `${project.name} in ${project.subCommunity}: from AED ${project.priceFromAED.toLocaleString()}, ${project.paymentPlan?.label} payment plan, handover ${project.handoverQuarter} ${project.handoverYear}.`,
  };
}

function Section({
  id,
  title,
  children,
  titleBlue = false,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  titleBlue?: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-rule py-10">
      <h2 className={`type-display-m mb-6 ${titleBlue ? "text-blue" : "text-midnight"}`}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const project = await getProjectBySlug(slug);
  if (!project || !project.publishedAt) notFound();

  const declined = project.alcazarStatus === "declined";
  if (declined && !project.declinePublic) notFound();

  const t = await getTranslations("project");
  const tps = await getTranslations("projects");
  const developer =
    project.developer && typeof project.developer === "object"
      ? (project.developer as Developer)
      : null;
  const community =
    project.community && typeof project.community === "object" ? project.community : null;
  const lenders = (project.lendersFinancing ?? []).filter(
    (l): l is Lender => typeof l === "object" && l !== null,
  );

  const payload = await getPayloadClient();
  const [similar, supply, agentRes] = await Promise.all([
    declined ? Promise.resolve([]) : getSimilarProjects(project),
    getSupplyInWindow(project),
    payload.find({ collection: "agents", limit: 1, sort: "slug" }),
  ]);
  const agent = agentRes.docs[0] as Agent | undefined;

  const waText = encodeURIComponent(
    `Enquiry from alcazar.ae — ${project.name}, ${project.subCommunity}. Ref ${project.slug}.`,
  );
  const waHref = agent?.whatsapp
    ? `https://wa.me/${agent.whatsapp.replace(/[^\d]/g, "")}?text=${waText}`
    : null;

  const mortgageableKey =
    project.mortgageable === "yes"
      ? "mortgageableYes"
      : project.mortgageable === "at-handover-only"
        ? "mortgageableAtHandover"
        : project.mortgageable === "no"
          ? "mortgageableNo"
          : "mortgageableUnknown";

  const NAV = [
    ["overview", t("navOverview")],
    ["plan", t("navPlan")],
    ["units", t("navUnits")],
    ["location", t("navLocation")],
    ["financing", t("navFinancing")],
    ["our-view", t("navView")],
    ["enquire", t("navEnquire")],
  ] as const;

  const facts: Array<[string, React.ReactNode]> = [
    [t("priceFrom"), <PriceDisplay key="p" amountAED={project.priceFromAED} convertedClassName="type-micro" />],
    [t("sizeFrom"), <AreaDisplay key="s" sqft={project.sizeFromSqft} />],
    [t("pricePerSqft"), project.pricePerSqftFrom?.toLocaleString() ?? "—"],
    [t("bedrooms"), formatBedrooms(project.bedroomsMin, project.bedroomsMax)],
    [t("handover"), `${project.handoverQuarter} ${project.handoverYear}`],
    [t("paymentPlan"), project.paymentPlan?.label ?? "—"],
    [t("developer"), developer?.name ?? "—"],
    [t("dldNumber"), project.dldProjectNumber ?? "—"],
  ];

  return (
    <CompareProvider>
      {/* Sticky sub-nav */}
      <nav className="sticky top-0 z-30 border-b border-rule bg-sand">
        <div className="mx-auto flex max-w-container gap-5 overflow-x-auto px-4 py-3 md:px-6">
          {NAV.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="type-eyebrow whitespace-nowrap text-midnight/60 transition-colors duration-fast ease-brand hover:text-blue"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-container px-4 pb-16 md:px-6">
        {/* Header */}
        <header id="overview" className="scroll-mt-24 flex flex-col gap-3 py-10">
          <Eyebrow>
            {(project.propertyTypes ?? []).join(" · ")} ·{" "}
            {formatBedrooms(project.bedroomsMin, project.bedroomsMax)} ·{" "}
            {community?.name ?? project.subCommunity}, {project.emirate}
          </Eyebrow>
          <h1 className="type-display-l text-midnight">
            {project.name}, {project.subCommunity}
          </h1>
          {declined ? (
            <div className="max-w-2xl border border-rule bg-white p-5">
              <p className="type-display-s text-midnight">{t("declinedTitle")}</p>
              <p className="type-body mt-2 text-midnight/80">{project.declineReason}</p>
              <p className="type-body-s mt-2 text-midnight/60">{t("declinedNote")}</p>
            </div>
          ) : null}
        </header>

        {/* Gallery (developer-supplied only) or placeholder field */}
        {!declined ? (
          <div className="relative flex aspect-[21/9] items-center justify-center overflow-hidden bg-sand">
            <span className="font-display text-display-xl font-light text-blue/25">Á</span>
            {project.trakheesiPermitNumber ? (
              <span className="type-micro absolute bottom-0 end-0 bg-white/90 px-3 py-1.5 text-midnight/60">
                {t("legalPermit", { number: project.trakheesiPermitNumber })}
                {developer ? ` · ${developer.name}` : ""}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Fact bar */}
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border border-rule bg-white p-6 sm:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="type-micro uppercase text-midnight/50">{label}</span>
              <span className="type-body-s font-medium text-midnight">{value}</span>
            </div>
          ))}
        </div>

        {/* Payment plan */}
        <Section id="plan" title={t("planTitle")}>
          {project.paymentPlan?.milestones?.length ? (
            <PaymentPlanVisualiser
              milestones={project.paymentPlan.milestones.map((m) => ({
                label: m.label,
                pct: m.pct,
                trigger: m.trigger,
              }))}
              defaultPriceAED={project.priceFromAED}
              planLabel={project.paymentPlan.label}
            />
          ) : (
            <p className="type-body text-midnight/70">{project.paymentPlan?.label}</p>
          )}
        </Section>

        {/* Units */}
        {!declined && project.unitTypes?.length ? (
          <Section id="units" title={t("unitsTitle")}>
            <div className="overflow-x-auto border border-rule bg-white">
              <table className="w-full min-w-[38rem] border-collapse">
                <thead>
                  <tr className="border-b border-rule">
                    {[t("unitLayout"), t("unitBeds"), t("unitSize"), t("unitPriceFrom"), t("unitAvailability")].map(
                      (h) => (
                        <th key={h} className="type-eyebrow p-3 text-start text-midnight/60">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {project.unitTypes.map((u) => (
                    <tr key={u.id} className="border-b border-rule/60">
                      <td className="type-body-s p-3 font-medium text-midnight">{u.label}</td>
                      <td className="type-body-s p-3 text-midnight">
                        {u.bedrooms === 0 ? tps("studio") : u.bedrooms}
                      </td>
                      <td className="type-body-s p-3 text-midnight">
                        {u.sizeSqftMin ? (
                          <AreaDisplay sqft={u.sizeSqftMin} sqftMax={u.sizeSqftMax} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="type-body-s p-3 text-midnight">
                        {u.priceFromAED ? (
                          <PriceDisplay amountAED={u.priceFromAED} convertedClassName="type-micro" />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="type-body-s p-3 text-midnight/70">
                        {u.availability === "available"
                          ? t("availabilityAvailable")
                          : u.availability === "limited"
                            ? t("availabilityLimited")
                            : t("availabilitySoldOut")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        ) : null}

        {/* Location + supply in window */}
        <Section id="location" title={t("locationTitle")}>
          <div className="flex flex-col gap-6">
            <p className="type-body text-midnight/80">
              {community?.name ?? project.subCommunity}, {project.emirate}
              {community?.transportNotes ? ` — ${community.transportNotes}` : ""}
            </p>
            <div>
              <h3 className="type-display-s mb-3 text-midnight">{t("supplyTitle")}</h3>
              {supply.length > 0 ? (
                <ul className="flex flex-col divide-y divide-rule border border-rule bg-white">
                  {supply.map((s) => (
                    <li key={s.id} className="flex items-baseline justify-between gap-4 p-3">
                      <Link
                        href={`/projects/${s.slug}`}
                        className="type-body-s font-medium text-midnight hover:text-blue"
                      >
                        {s.name}
                      </Link>
                      <span className="type-body-s whitespace-nowrap text-midnight/60">
                        {s.handoverQuarter} {s.handoverYear}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="type-body-s text-midnight/60">{t("supplyNone")}</p>
              )}
            </div>
          </div>
        </Section>

        {/* Financing */}
        {!declined ? (
          <Section id="financing" title={t("financingTitle")}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-4 border border-rule bg-white p-6">
                <p className="type-display-s text-midnight">{t(mortgageableKey)}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="type-micro uppercase text-midnight/50">{t("depositResident")}</p>
                    <p className="type-body font-medium text-midnight">
                      <PriceDisplay
                        amountAED={depositFor(project.priceFromAED, INDICATIVE_LTV.residentFirstPropertyPct)}
                        convertedClassName="type-micro"
                      />
                    </p>
                  </div>
                  <div>
                    <p className="type-micro uppercase text-midnight/50">{t("depositNonResident")}</p>
                    <p className="type-body font-medium text-midnight">
                      <PriceDisplay
                        amountAED={depositFor(project.priceFromAED, INDICATIVE_LTV.nonResidentPct)}
                        convertedClassName="type-micro"
                      />
                    </p>
                  </div>
                </div>
                <p className="type-micro text-midnight/50">
                  {t("ltvNote", {
                    residentPct: INDICATIVE_LTV.residentFirstPropertyPct,
                    nonResidentPct: INDICATIVE_LTV.nonResidentPct,
                    source: INDICATIVE_LTV.sourceNote,
                    date: INDICATIVE_LTV.effectiveFrom,
                  })}
                </p>
                <Link
                  href={`/mortgages/calculator?price=${project.priceFromAED}&propertyStatus=off-plan&project=${project.slug}`}
                  className="type-eyebrow self-start border border-blue px-4 py-2.5 text-blue transition-colors duration-fast ease-brand hover:bg-blue hover:text-sand"
                >
                  {t("openCalculator")}
                </Link>
              </div>
              {lenders.length > 0 ? (
                <div className="border border-rule bg-white p-6">
                  <p className="type-eyebrow mb-4 text-midnight/60">{t("lendersKnown")}</p>
                  <ul className="flex flex-col divide-y divide-rule">
                    {lenders.map((l) => (
                      <li key={l.id} className="flex items-baseline justify-between gap-4 py-2.5">
                        <span className="type-body-s font-medium text-midnight">{l.name}</span>
                        <span className="type-body-s text-midnight/60">
                          LTV {l.maxLtvResidentPct}% / {l.maxLtvNonResidentPct}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}

        {/* Our view — the page's one blue headline (§1) */}
        <Section id="our-view" title={t("viewTitle")} titleBlue>
          <CropMarks>
            <div className="flex flex-col gap-8 bg-sand p-6 md:p-8">
              {project.alcazarVerdict ? (
                <div className="type-body-l max-w-2xl text-midnight [&_p]:mb-3">
                  <RichText data={project.alcazarVerdict} />
                </div>
              ) : null}
              {project.alcazarFilterScores ? (
                <FilterScoreRow scores={project.alcazarFilterScores} />
              ) : null}
            </div>
          </CropMarks>
        </Section>

        {/* Developer */}
        {developer ? (
          <Section id="developer" title={t("developerTitle")}>
            <div className="flex max-w-2xl flex-col gap-3 border border-rule bg-white p-6">
              <p className="type-display-s text-midnight">{developer.name}</p>
              <p className="type-body-s text-midnight/70">
                {[
                  developer.foundedYear ? t("developerFounded", { year: developer.foundedYear }) : null,
                  developer.projectsDelivered != null
                    ? t("developerDelivered", { count: developer.projectsDelivered })
                    : null,
                  developer.averageHandoverSlippageMonths != null
                    ? t("developerSlippage", { months: developer.averageHandoverSlippageMonths })
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {developer.deliveryTrackRecord ? (
                <div className="type-body text-midnight/80">
                  <RichText data={developer.deliveryTrackRecord} />
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}

        {/* Similar */}
        {similar.length > 0 ? (
          <Section id="similar" title={t("similarTitle")}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <ProjectCard key={s.id} project={s as Project} />
              ))}
            </div>
          </Section>
        ) : null}

        {/* Enquiry */}
        {!declined ? (
          <Section id="enquire" title={t("enquireTitle", { name: project.name })}>
            <div className="mb-6">
              <Suspense fallback={null}>
                <SentBanner consultant={agent?.name ?? "Alcázar"} />
              </Suspense>
            </div>
            <div className="grid gap-8 md:grid-cols-[minmax(0,20rem)_1fr]">
              <div className="flex flex-col gap-4">
                {agent ? (
                  <div className="flex flex-col gap-1 border border-rule bg-white p-5">
                    <p className="type-micro uppercase text-midnight/50">{t("consultant")}</p>
                    <p className="type-display-s text-midnight">{agent.name}</p>
                    <p className="type-body-s text-midnight/70">{agent.role}</p>
                    <p className="type-micro text-midnight/50">RERA BRN {agent.brn}</p>
                    {waHref ? (
                      <a
                        href={waHref}
                        className="type-eyebrow mt-3 self-start bg-blue px-4 py-2.5 text-sand transition-colors duration-fast ease-brand hover:bg-midnight"
                      >
                        {t("whatsapp")}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <form action={createLead} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="returnTo" value={`/${locale === "en" ? "" : `${locale}/`}projects/${project.slug}`.replace("//", "/")} />
                <input type="hidden" name="sourceProject" value={project.id} />
                <input type="hidden" name="sourcePage" value={`/projects/${project.slug}`} />
                <input type="hidden" name="locale" value={locale} />
                {/* Honeypot */}
                <div className="hidden" aria-hidden>
                  <label>
                    Company
                    <input type="text" name="company" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
                <Select
                  id="lead-residency"
                  name="residencyStatus"
                  label={t("formResidency")}
                  options={[
                    { value: "non-resident", label: t("residencyNonResident") },
                    { value: "uae-resident", label: t("residencyResident") },
                    { value: "uae-national", label: t("residencyNational") },
                  ]}
                />
                <Field id="lead-name" name="name" label={t("formName")} required />
                <Field id="lead-email" name="email" type="email" label={t("formEmail")} />
                <Field id="lead-phone" name="phone" type="tel" label={t("formPhone")} />
                <Field id="lead-budget" name="budgetBandAED" label={t("formBudget")} />
                <Select
                  id="lead-purpose"
                  name="purpose"
                  label={t("formPurpose")}
                  options={[
                    { value: "investment", label: t("purposeInvestment") },
                    { value: "end-use", label: t("purposeEndUse") },
                    { value: "both", label: t("purposeBoth") },
                  ]}
                />
                <div className="sm:col-span-2">
                  <Field id="lead-message" name="message" label={t("formMessage")} />
                </div>
                <label className="type-body-s flex items-center gap-2 text-midnight">
                  <input type="checkbox" name="financeNeeded" className="h-4 w-4 accent-[var(--alcazar-blue)]" />
                  {t("formFinance")}
                </label>
                <label className="type-body-s flex items-center gap-2 text-midnight">
                  <input type="checkbox" name="whatsappConsent" className="h-4 w-4 accent-[var(--alcazar-blue)]" />
                  {t("formWhatsappConsent")}
                </label>
                <button
                  type="submit"
                  className="type-eyebrow bg-blue px-6 py-3.5 text-sand transition-colors duration-fast ease-brand hover:bg-midnight sm:col-span-2 sm:justify-self-start"
                >
                  {t("formSubmit")}
                </button>
              </form>
            </div>
          </Section>
        ) : null}

        {/* Legal strip */}
        <div className="mt-4 flex flex-col gap-2 border-t border-rule pt-6">
          {project.trakheesiPermitNumber ? (
            <p className="type-micro text-midnight/50">
              {t("legalPermit", { number: project.trakheesiPermitNumber })}
            </p>
          ) : null}
          <p className="type-micro text-midnight/50">{t("legalEscrow")}</p>
          <p className="type-micro text-midnight/50">{t("legalPrices")}</p>
          <p className="type-micro text-midnight/50">{t("legalProjections")}</p>
        </div>
      </div>
    </CompareProvider>
  );
}
