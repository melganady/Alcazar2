import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { CropMarks } from "@/components/primitives/CropMarks";
import { MediaWell } from "@/components/primitives/MediaWell";
import { ProjectGallery, type GalleryImage } from "@/components/project/ProjectGallery";
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
import { brokerNumber } from "@/lib/legalEntity";
import { depositFor, INDICATIVE_LTV } from "@/lib/mortgage/indicative";
import { createLead } from "@/lib/actions";
import { formatBedrooms, formatHandoverOrDash } from "@/lib/format";
import { alternates, breadcrumbJsonLd, projectJsonLd, projectTitle } from "@/lib/seo";
import { TrackProjectView } from "@/components/analytics/TrackProjectView";
import { WhatsAppLink } from "@/components/analytics/WhatsAppLink";
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
  const title = project.seo?.title ?? projectTitle(project);
  const description =
    project.seo?.description ??
    `${project.name} in ${project.subCommunity}: from AED ${project.priceFromAED.toLocaleString()}, ${project.paymentPlan?.label} payment plan, handover ${project.handoverQuarter} ${project.handoverYear}.`;
  return {
    title,
    description,
    alternates: alternates(`/projects/${slug}`),
    openGraph: {
      title,
      description,
      images: [{ url: `/og/${slug}`, width: 1200, height: 630 }],
    },
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
      <h2 className={`type-display-m mb-6 ${titleBlue ? "text-iron" : "text-iron"}`}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function ProjectPage({
  params,
  preview = false,
}: {
  params: Promise<{ locale: string; slug: string }>;
  /** Set only by the authenticated staff preview route (§11.1). */
  preview?: boolean;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  // Unpublished projects are invisible publicly: without a Trakheesi permit
  // they may not be advertised. Staff can still review them via /preview.
  if (!project.publishedAt && !preview) notFound();

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
  // Hero first, then every gallery image. 335 of these were stored but never
  // rendered until the gallery existed.
  const galleryImages: GalleryImage[] = [
    project.media?.hero,
    ...(project.media?.gallery ?? []),
  ]
    .filter((m): m is NonNullable<typeof m> => Boolean(m) && typeof m === "object")
    .map((m) => ({
      url: (m as { url?: string }).url ?? "",
      alt: (m as { alt?: string }).alt ?? `${project.name}, ${project.subCommunity}`,
    }))
    .filter((m) => m.url);

  const floorPlans = (project.media?.floorPlans ?? [])
    .filter((f): f is NonNullable<typeof f> => Boolean(f) && typeof f === "object")
    .map((f) => ({ url: (f as { url?: string }).url ?? "" }))
    .filter((f) => f.url);
  const brochureUrl =
    project.media?.brochure && typeof project.media.brochure === "object"
      ? project.media.brochure.url
      : undefined;

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
    [
      t("priceFrom"),
      project.priceFromAED > 0 ? (
        <PriceDisplay key="p" amountAED={project.priceFromAED} convertedClassName="type-micro" />
      ) : (
        tps("priceOnApplication")
      ),
    ],
    [t("sizeFrom"), <AreaDisplay key="s" sqft={project.sizeFromSqft} />],
    [t("pricePerSqft"), project.pricePerSqftFrom?.toLocaleString() ?? "—"],
    [t("bedrooms"), formatBedrooms(project.bedroomsMin, project.bedroomsMax)],
    [t("handover"), formatHandoverOrDash(project.handoverQuarter, project.handoverYear)],
    [t("paymentPlan"), project.paymentPlan?.label ?? "—"],
    [t("developer"), developer?.name ?? "—"],
    [t("dldNumber"), project.dldProjectNumber ?? "—"],
  ];

  return (
    <CompareProvider>
      <TrackProjectView
        slug={project.slug}
        community={community?.name}
        status={project.alcazarStatus}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd(project)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Projects", path: "/projects" },
              { name: project.name, path: `/projects/${project.slug}` },
            ]),
          ),
        }}
      />
      {/* Sticky sub-nav */}
      <nav className="sticky top-0 z-30 border-b border-rule bg-frost">
        <div className="mx-auto flex max-w-container gap-5 overflow-x-auto px-4 py-3 md:px-6">
          {NAV.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="type-eyebrow whitespace-nowrap text-iron/80 transition-colors duration-fast ease-brand hover:text-iron hover:underline hover:underline-offset-4"
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
            {community?.name ?? project.subCommunity}, {project.region}
          </Eyebrow>
          <h1 className="type-display-l text-iron">
            {project.name}, {project.subCommunity}
          </h1>
          {declined ? (
            <div className="max-w-2xl border border-rule bg-linen p-5">
              <p className="type-display-s text-iron">{t("declinedTitle")}</p>
              <p className="type-body mt-2 text-iron/80">{project.declineReason}</p>
              <p className="type-body-s mt-2 text-iron/80">{t("declinedNote")}</p>
            </div>
          ) : null}
        </header>

        {/* Gallery (developer-supplied only), or a composed field while imagery is pending */}
        {!declined ? (
          galleryImages.length > 0 ? (
            <ProjectGallery
              images={galleryImages}
              permitNumber={project.trakheesiPermitNumber}
              developer={developer?.name}
            />
          ) : (
            <div className="relative">
              <MediaWell
                alt={`${project.name}, ${project.subCommunity}`}
                label={`${project.name} · ${project.subCommunity}`}
                ratio="21/9"
                priority
                sizes="100vw"
              />
              {project.trakheesiPermitNumber ? (
                <span className="type-micro absolute bottom-0 end-0 bg-linen/90 px-3 py-1.5 text-iron/80">
                  {t("legalPermit", { number: project.trakheesiPermitNumber })}
                  {developer ? ` · ${developer.name}` : ""}
                </span>
              ) : null}
            </div>
          )
        ) : null}

        {/* Fact bar */}
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border border-rule bg-linen p-6 sm:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="type-micro uppercase text-iron/80">{label}</span>
              <span className="type-body-s font-medium text-iron">{value}</span>
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
              slug={project.slug}
            />
          ) : (
            <p className="type-body text-iron/80">{project.paymentPlan?.label}</p>
          )}
        </Section>

        {/* Units */}
        {!declined && project.unitTypes?.length ? (
          <Section id="units" title={t("unitsTitle")}>
            <div className="overflow-x-auto border border-rule bg-linen">
              <table className="w-full min-w-[38rem] border-collapse">
                <thead>
                  <tr className="border-b-2 border-pine">
                    {[t("unitLayout"), t("unitBeds"), t("unitSize"), t("unitPriceFrom"), t("unitAvailability")].map(
                      (h) => (
                        <th key={h} className="type-eyebrow p-3 text-start text-iron/80">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {project.unitTypes.map((u) => (
                    <tr key={u.id} className="border-b border-rule/60">
                      <td className="type-body-s p-3 font-medium text-iron">
                        <span className="flex items-center gap-3">
                          {u.floorPlan && typeof u.floorPlan === "object" && u.floorPlan.url ? (
                            <a
                              href={u.floorPlan.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative block h-12 w-12 shrink-0 overflow-hidden border border-rule bg-linen"
                            >
                              <Image
                                src={u.floorPlan.url}
                                alt={u.floorPlan.alt ?? `${u.label} layout`}
                                fill
                                sizes="48px"
                                className="object-contain"
                              />
                            </a>
                          ) : null}
                          {u.label}
                        </span>
                      </td>
                      <td className="type-body-s p-3 text-iron">
                        {u.bedrooms === 0 ? tps("studio") : u.bedrooms}
                      </td>
                      <td className="type-body-s p-3 text-iron">
                        {u.sizeSqftMin ? (
                          <AreaDisplay sqft={u.sizeSqftMin} sqftMax={u.sizeSqftMax} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="type-body-s p-3 text-iron">
                        {u.priceFromAED ? (
                          <PriceDisplay amountAED={u.priceFromAED} convertedClassName="type-micro" />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="type-body-s p-3 text-iron/80">
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

        {/* Amenities — what the developer is actually building in */}
        {!declined && (project.amenities ?? []).length > 0 ? (
          <Section id="amenities" title={t("amenitiesTitle")}>
            <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {(project.amenities ?? []).map((a) => (
                <li key={a} className="type-body-s flex items-baseline gap-2.5 text-iron/80">
                  <span aria-hidden className="mt-1.5 h-px w-4 shrink-0 bg-pine" />
                  {a}
                </li>
              ))}
            </ul>
            {project.furnishing || project.readinessPct != null ? (
              <p className="type-body-s mt-6 text-iron/80">
                {project.furnishing ? `${project.furnishing}.` : ""}
                {project.readinessPct != null
                  ? ` ${t("readiness", { pct: project.readinessPct })}`
                  : ""}
              </p>
            ) : null}
          </Section>
        ) : null}

        {/* Downloads — floor plans and the brochure, licensed with the feed */}
        {!declined && (floorPlans.length > 0 || brochureUrl) ? (
          <Section id="downloads" title={t("downloadsTitle")}>
            <ul className="flex flex-wrap gap-4">
              {floorPlans.map((f, i) => (
                <li key={f.url}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="type-eyebrow flex items-center gap-2 border border-pine px-5 py-3 text-iron transition-colors duration-fast ease-brand hover:bg-pine/25"
                  >
                    {t("floorPlanN", { n: i + 1 })}
                  </a>
                </li>
              ))}
              {brochureUrl ? (
                <li>
                  <a
                    href={brochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="type-eyebrow flex items-center gap-2 bg-iron px-5 py-3 text-ash transition-colors duration-fast ease-brand hover:bg-iron/85"
                  >
                    {t("brochure")}
                  </a>
                </li>
              ) : null}
            </ul>
            <p className="type-micro mt-4 text-iron/80">{t("downloadsNote")}</p>
          </Section>
        ) : null}

        {/* Location + supply in window */}
        <Section id="location" title={t("locationTitle")}>
          <div className="flex flex-col gap-6">
            <p className="type-body text-iron/80">
              {community?.name ?? project.subCommunity}, {project.region}
              {community?.transportNotes ? ` — ${community.transportNotes}` : ""}
            </p>
            {(project.nearbyPlaces ?? []).length > 0 ? (
              <div>
                <h3 className="type-display-s mb-3 text-iron">{t("nearbyTitle")}</h3>
                <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(project.nearbyPlaces ?? []).map((n) => (
                    <li
                      key={n.id ?? n.name}
                      className="type-body-s flex items-baseline justify-between gap-3 border-b border-rule py-1.5 text-iron"
                    >
                      <span>{n.name}</span>
                      <span className="whitespace-nowrap text-iron/80">
                        {n.minutes != null ? t("minutesAway", { n: n.minutes }) : ""}
                        {n.minutes != null && n.distanceKm != null ? " · " : ""}
                        {n.distanceKm != null ? `${n.distanceKm} km` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <h3 className="type-display-s mb-3 text-iron">{t("supplyTitle")}</h3>
              {supply.length > 0 ? (
                <ul className="flex flex-col divide-y divide-rule border border-rule bg-linen">
                  {supply.map((s) => (
                    <li key={s.id} className="flex items-baseline justify-between gap-4 p-3">
                      <Link
                        href={`/projects/${s.slug}`}
                        className="type-body-s font-medium text-iron underline-offset-4 hover:underline"
                      >
                        {s.name}
                      </Link>
                      <span className="type-body-s whitespace-nowrap text-iron/80">
                        {formatHandoverOrDash(s.handoverQuarter, s.handoverYear)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="type-body-s text-iron/80">{t("supplyNone")}</p>
              )}
            </div>
          </div>
        </Section>

        {/* Financing */}
        {!declined ? (
          <Section id="financing" title={t("financingTitle")}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-4 border border-rule bg-linen p-6">
                <p className="type-display-s text-iron">{t(mortgageableKey)}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="type-micro uppercase text-iron/80">{t("depositResident")}</p>
                    <p className="type-body font-medium text-iron">
                      <PriceDisplay
                        amountAED={depositFor(project.priceFromAED, INDICATIVE_LTV.residentFirstPropertyPct)}
                        convertedClassName="type-micro"
                      />
                    </p>
                  </div>
                  <div>
                    <p className="type-micro uppercase text-iron/80">{t("depositNonResident")}</p>
                    <p className="type-body font-medium text-iron">
                      <PriceDisplay
                        amountAED={depositFor(project.priceFromAED, INDICATIVE_LTV.nonResidentPct)}
                        convertedClassName="type-micro"
                      />
                    </p>
                  </div>
                </div>
                <p className="type-micro text-iron/80">
                  {t("ltvNote", {
                    residentPct: INDICATIVE_LTV.residentFirstPropertyPct,
                    nonResidentPct: INDICATIVE_LTV.nonResidentPct,
                    source: INDICATIVE_LTV.sourceNote,
                    date: INDICATIVE_LTV.effectiveFrom,
                  })}
                </p>
                <Link
                  href={`/mortgages/calculator?price=${project.priceFromAED}&propertyStatus=off-plan&project=${project.slug}`}
                  className="type-eyebrow self-start border border-iron px-4 py-2.5 text-iron transition-colors duration-fast ease-brand hover:bg-iron hover:text-ash"
                >
                  {t("openCalculator")}
                </Link>
              </div>
              {lenders.length > 0 ? (
                <div className="border border-rule bg-linen p-6">
                  <p className="type-eyebrow mb-4 text-iron/80">{t("lendersKnown")}</p>
                  <ul className="flex flex-col divide-y divide-rule">
                    {lenders.map((l) => (
                      <li key={l.id} className="flex items-baseline justify-between gap-4 py-2.5">
                        <span className="type-body-s font-medium text-iron">{l.name}</span>
                        <span className="type-body-s text-iron/80">
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

        {/* Our view — the verdict panel, framed in ash wood */}
        <Section id="our-view" title={t("viewTitle")} titleBlue>
          <CropMarks>
            <div className="flex flex-col gap-8 border-s-2 border-pine bg-pine/18 p-6 md:p-8">
              {project.alcazarVerdict ? (
                <div className="type-body-l max-w-2xl text-iron [&_p]:mb-3">
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
            <div className="flex max-w-2xl flex-col gap-3 border border-rule bg-linen p-6">
              <p className="type-display-s text-iron">{developer.name}</p>
              <p className="type-body-s text-iron/80">
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
                <div className="type-body text-iron/80">
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
                  <div className="flex flex-col gap-1 border border-rule bg-linen p-5">
                    <p className="type-micro uppercase text-iron/80">{t("consultant")}</p>
                    <p className="type-display-s text-iron">{agent.name}</p>
                    <p className="type-body-s text-iron/80">{agent.role}</p>
                    {brokerNumber(agent.brn, agent.brnExpiry) ? (
                      <p className="type-micro text-iron/80">{brokerNumber(agent.brn, agent.brnExpiry)}</p>
                    ) : null}
                    {waHref ? (
                      <WhatsAppLink
                        href={waHref}
                        source="project-detail"
                        slug={project.slug}
                        className="mt-3 self-start px-4 py-2.5"
                      >
                        {t("whatsapp")}
                      </WhatsAppLink>
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
                <label className="type-body-s flex items-center gap-2 text-iron">
                  <input type="checkbox" name="financeNeeded" className="h-4 w-4 accent-[var(--iron-grey)]" />
                  {t("formFinance")}
                </label>
                <label className="type-body-s flex items-center gap-2 text-iron">
                  <input type="checkbox" name="whatsappConsent" className="h-4 w-4 accent-[var(--iron-grey)]" />
                  {t("formWhatsappConsent")}
                </label>
                <button
                  type="submit"
                  className="type-eyebrow bg-iron px-6 py-3.5 text-ash transition-colors duration-fast ease-brand hover:bg-iron/85 sm:col-span-2 sm:justify-self-start"
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
            <p className="type-micro text-iron/80">
              {t("legalPermit", { number: project.trakheesiPermitNumber })}
            </p>
          ) : null}
          <p className="type-micro text-iron/80">{t("legalEscrow")}</p>
          <p className="type-micro text-iron/80">{t("legalPrices")}</p>
          <p className="type-micro text-iron/80">{t("legalProjections")}</p>
        </div>
      </div>
    </CompareProvider>
  );
}
