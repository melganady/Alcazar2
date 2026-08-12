import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { CropMarks } from "@/components/primitives/CropMarks";
import { StatBlock } from "@/components/primitives/StatBlock";
import { ProjectCard } from "@/components/project/ProjectCard";
import { CompareProvider } from "@/components/project/CompareProvider";
import { ProjectSlider } from "@/components/sections/ProjectSlider";
import { MiniCalculator } from "@/components/sections/MiniCalculator";
import { getPayloadClient } from "@/lib/payload";
import { brokerNumber } from "@/lib/legalEntity";
import { baseWhere } from "@/lib/projects";
import { getShowcaseImages, getSlides } from "@/lib/showcase";
import { loadMortgageConstants } from "@/lib/mortgage/loadConstants";
import {
  EIGHT_TESTS,
  FIVE_STAGES,
  INVESTMENT_MODELS,
  MARKETS,
  VERBATIM,
} from "@/lib/content";
import type { Project } from "@/payload-types";

export const revalidate = 3600;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const payload = await getPayloadClient();
  const [slides, showcase, shortlist, stats, constants, articles, agents] = await Promise.all([
    getSlides(6),
    getShowcaseImages(2),
    payload.find({
      collection: "projects",
      where: { and: [...baseWhere(), { alcazarStatus: { equals: "shortlisted" } }] },
      sort: "editorialOrder",
      limit: 3,
      depth: 1,
    }),
    payload.findGlobal({ slug: "site-stats" }),
    loadMortgageConstants(),
    payload.find({
      collection: "articles",
      where: { publishedAt: { exists: true } },
      sort: "-publishedAt",
      limit: 3,
      depth: 0,
    }),
    payload.find({ collection: "agents", limit: 1, sort: "slug" }),
  ]);

  const agent = agents.docs[0];
  const showFilterNumber =
    stats?.reviewsTracked &&
    typeof stats.launchesReviewedThisYear === "number" &&
    typeof stats.reachedShortlistThisYear === "number";
  const marketStats = stats?.marketStats ?? [];
  const liveMarkets = MARKETS.filter((m) => m.live);

  const waHref = agent?.whatsapp
    ? `https://wa.me/${agent.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent("Enquiry from alcazar.ae")}`
    : null;

  return (
    <CompareProvider>
      {/* 1 — Hero. Typographic on the frost ground; iron carries the headline. */}
      <section className="mx-auto flex max-w-container flex-col items-start gap-7 px-4 py-20 md:px-6 md:py-28">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="type-display-xl max-w-4xl text-iron">{t("title")}</h1>
        <p className="type-body-l max-w-2xl text-iron/80">{t("support")}</p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/projects"
            className="type-eyebrow bg-iron px-6 py-3.5 text-ash transition-colors duration-fast ease-brand hover:bg-iron/85"
          >
            {t("ctaShortlist")}
          </Link>
          <Link
            href="/mortgages/calculator"
            className="type-eyebrow border border-iron px-6 py-3.5 text-iron transition-colors duration-fast ease-brand hover:bg-iron hover:text-ash"
          >
            {t("ctaBorrow")}
          </Link>
        </div>
      </section>

      {/* 2 — Live inventory, as a slider */}
      {slides.length > 0 ? (
        <section className="border-t border-rule">
          <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="type-display-m text-iron">{t("liveTitle")}</h2>
              <Link href="/projects" className="type-eyebrow text-iron/80 hover:text-iron">
                {t("allProjects")} →
              </Link>
            </div>
            <ProjectSlider slides={slides} />
          </div>
        </section>
      ) : null}

      {/* 3 — How capital goes in */}
      <section className="border-t border-rule bg-pine/8">
        <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
          <div className="flex flex-col gap-3">
            <Eyebrow>{t("modelsEyebrow")}</Eyebrow>
            <h2 className="type-display-m max-w-3xl text-iron">{t("modelsTitle")}</h2>
          </div>
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {INVESTMENT_MODELS.map((m, i) => (
              <div key={m.key} className="flex flex-col gap-2 border-t-2 border-pine pt-4">
                <span className="type-micro text-iron/80">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="type-display-s text-iron">{m.title}</h3>
                <p className="type-body-s text-iron/80">{m.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — The filter, with a licensed render alongside */}
      <section className="border-t border-rule">
        <div className="mx-auto grid max-w-container gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1fr_minmax(0,24rem)]">
          <div className="flex flex-col gap-6">
            <Eyebrow>{t("filterEyebrow")}</Eyebrow>
            <h2 className="type-display-m max-w-2xl text-iron">
              {showFilterNumber
                ? t("filterNumber", {
                    reviewed: stats.launchesReviewedThisYear!,
                    shortlisted: stats.reachedShortlistThisYear!,
                  })
                : t("filterFallback")}
            </h2>
            <p className="type-body-l max-w-2xl text-iron/80">{VERBATIM.theTest}</p>
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {EIGHT_TESTS.map((test, i) => (
                <div key={test.key} className="flex flex-col gap-1.5 border-t border-rule pt-4">
                  <span aria-hidden className="type-micro text-pine">{String(i + 1).padStart(2, "0")}</span>
                  <span className="type-display-s text-iron">{test.title}</span>
                </div>
              ))}
            </div>
            <Link href="/how-we-work" className="type-eyebrow mt-2 self-start text-iron/80 hover:text-iron">
              {t("howWeWork")} →
            </Link>
          </div>
          {showcase[0] ? (
            <figure className="flex flex-col gap-2 self-start">
              <div className="relative aspect-[3/4] overflow-hidden bg-linen">
                <Image
                  src={showcase[0].url}
                  alt={showcase[0].alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 24rem"
                  className="object-cover"
                />
              </div>
              <figcaption className="type-micro text-iron/80">{showcase[0].project}</figcaption>
            </figure>
          ) : null}
        </div>
      </section>

      {/* 5 — Shortlist */}
      {shortlist.docs.length > 0 ? (
        <section className="border-t border-rule">
          <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="type-display-m text-iron">{t("shortlistTitle")}</h2>
              <Link
                href="/projects?shortlisted=1"
                className="type-eyebrow text-iron/80 hover:text-iron"
              >
                {t("allShortlisted")} →
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shortlist.docs.map((p) => (
                <ProjectCard key={p.id} project={p as Project} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 6 — Market bar. The page's one full iron field; type reverses to ash. */}
      {marketStats.length > 0 ? (
        <section className="bg-iron">
          <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
            <h2 className="type-display-m text-ash">{t("marketTitle")}</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {marketStats.map((s) => (
                <StatBlock
                  key={s.id}
                  tone="reversed"
                  value={s.value}
                  label={s.label}
                  source={`${s.source} · ${String(s.asOf).slice(0, 10)}`}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 7 — Where we place capital */}
      <section className="border-t border-rule bg-pine/8">
        <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
          <div className="flex flex-col gap-3">
            <Eyebrow>{t("marketsEyebrow")}</Eyebrow>
            <h2 className="type-display-m max-w-3xl text-iron">{t("marketsTitle")}</h2>
            <p className="type-body-l max-w-2xl text-iron/80">{t("marketsSupport")}</p>
          </div>
          <ul className="flex flex-wrap gap-x-10 gap-y-4">
            {liveMarkets.map((m) => (
              <li key={m.key} className="flex min-w-48 flex-col gap-1 border-t-2 border-pine pt-4">
                <span className="type-display-s text-iron">{m.name}</span>
                <span className="type-body-s text-iron/80">{m.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 8 — Financing */}
      <section className="border-t border-rule">
        <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
          <div className="flex flex-col gap-3">
            <h2 className="type-display-m text-iron">{t("financeTitle")}</h2>
            <p className="type-body-l max-w-2xl text-iron/80">
              {t("financeSupport", { pct: constants.ltv.nonResidentPct })}
            </p>
          </div>
          <MiniCalculator constants={constants} />
        </div>
      </section>

      {/* 9 — How we work */}
      <section className="border-t border-rule bg-pine/8">
        <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
          <h2 className="type-display-m text-iron">{t("stagesTitle")}</h2>
          <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
            {FIVE_STAGES.map((s) => (
              <li key={s.n} className="flex flex-col gap-2 border-t-2 border-pine pt-4">
                <span aria-hidden className="type-micro text-pine">{s.n}</span>
                <span className="type-display-s text-iron">{s.title}</span>
                <span className="type-body-s text-iron/80">{s.line}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 10 — Insights */}
      {articles.docs.length > 0 ? (
        <section className="border-t border-rule">
          <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="type-display-m text-iron">{t("insightsTitle")}</h2>
              <Link href="/insights" className="type-eyebrow text-iron/80 hover:text-iron">
                {t("allInsights")} →
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {articles.docs.map((a) => (
                <Link
                  key={a.id}
                  href={`/insights/${a.slug}`}
                  className="group flex flex-col gap-2 border border-rule bg-linen p-5 transition-colors duration-fast ease-brand hover:border-pine"
                >
                  <span className="type-micro uppercase text-iron/80">{a.category}</span>
                  <span className="type-display-s text-iron group-hover:underline group-hover:underline-offset-4">
                    {a.title}
                  </span>
                  {a.excerpt ? <span className="type-body-s text-iron/80">{a.excerpt}</span> : null}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 11 — Contact */}
      <section className="border-t border-rule">
        <div className="mx-auto px-4 py-16 md:px-6">
          <CropMarks className="mx-auto max-w-container">
            <div className="grid gap-8 bg-linen p-8 md:grid-cols-[1fr_minmax(0,18rem)] md:items-center">
              <div className="flex flex-col gap-3">
                <h2 className="type-display-m text-iron">{t("contactTitle")}</h2>
                <p className="type-body max-w-md text-iron/80">{t("contactSupport")}</p>
                {agent ? (
                  <p className="type-body-s mt-1 text-iron/80">
                    {[agent.name, agent.role, brokerNumber(agent.brn, agent.brnExpiry)].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-4">
                  {waHref ? (
                    <a
                      href={waHref}
                      className="type-eyebrow bg-iron px-6 py-3.5 text-ash transition-colors duration-fast ease-brand hover:bg-iron/85"
                    >
                      WhatsApp
                    </a>
                  ) : null}
                  <Link
                    href="/contact"
                    className="type-eyebrow border border-iron px-6 py-3.5 text-iron transition-colors duration-fast ease-brand hover:bg-iron hover:text-ash"
                  >
                    {t("contactCta")}
                  </Link>
                </div>
              </div>
              {showcase[1] ? (
                <div className="relative aspect-[4/3] overflow-hidden bg-ash">
                  <Image
                    src={showcase[1].url}
                    alt={showcase[1].alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 18rem"
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>
          </CropMarks>
        </div>
      </section>
    </CompareProvider>
  );
}
