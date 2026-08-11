import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { CropMarks } from "@/components/primitives/CropMarks";
import { StatBlock } from "@/components/primitives/StatBlock";
import { ProjectCard } from "@/components/project/ProjectCard";
import { CompareProvider } from "@/components/project/CompareProvider";
import { MiniCalculator } from "@/components/sections/MiniCalculator";
import { getPayloadClient } from "@/lib/payload";
import { baseWhere } from "@/lib/projects";
import { loadMortgageConstants } from "@/lib/mortgage/loadConstants";
import { EIGHT_TESTS, FIVE_STAGES, VERBATIM } from "@/lib/content";
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
  const [shortlist, stats, constants, articles, agents] = await Promise.all([
    payload.find({
      collection: "projects",
      where: { and: [...baseWhere(), { alcazarStatus: { equals: "shortlisted" } }] },
      sort: "editorialOrder",
      limit: 6,
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
  // §6.2 — render the number only when it is actually tracked. Never fake it.
  const showFilterNumber =
    stats?.reviewsTracked &&
    typeof stats.launchesReviewedThisYear === "number" &&
    typeof stats.reachedShortlistThisYear === "number";
  const marketStats = stats?.marketStats ?? [];

  const waHref = agent?.whatsapp
    ? `https://wa.me/${agent.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent("Enquiry from alcazar.ae")}`
    : null;

  return (
    <CompareProvider>
      {/* 1 — Hero. Sand field, blue headline: this composition's single blue element. */}
      <section className="mx-auto flex max-w-container flex-col items-start gap-7 px-4 py-24 md:px-6 md:py-32">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="type-display-xl max-w-4xl text-blue">{t("title")}</h1>
        <p className="type-body-l max-w-xl text-midnight/80">{t("support")}</p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/projects?shortlisted=1"
            className="type-eyebrow bg-blue px-6 py-3.5 text-sand transition-colors duration-fast ease-brand hover:bg-midnight"
          >
            {t("ctaShortlist")}
          </Link>
          <Link
            href="/mortgages/calculator"
            className="type-eyebrow border border-blue px-6 py-3.5 text-blue transition-colors duration-fast ease-brand hover:bg-blue hover:text-sand"
          >
            {t("ctaBorrow")}
          </Link>
        </div>
      </section>

      {/* 2 — The filter, stated */}
      <section className="border-t border-rule">
        <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
          <Eyebrow>The filter</Eyebrow>
          <h2 className="type-display-m max-w-3xl text-midnight">
            {showFilterNumber
              ? `Of ${stats.launchesReviewedThisYear} launches reviewed this year, ${stats.reachedShortlistThisYear} reached a client shortlist.`
              : "Every launch runs eight tests before it reaches you."}
          </h2>
          <p className="type-body-l max-w-2xl text-midnight/70">{VERBATIM.theTest}</p>
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {EIGHT_TESTS.map((test, i) => (
              <div key={test.key} className="flex flex-col gap-1.5 border-t border-rule pt-4">
                <span className="type-micro text-midnight/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="type-display-s text-midnight">{test.title}</span>
              </div>
            ))}
          </div>
          <Link href="/how-we-work" className="type-eyebrow self-start text-blue hover:text-midnight">
            How we work →
          </Link>
        </div>
      </section>

      {/* 3 — Shortlist strip */}
      {shortlist.docs.length > 0 ? (
        <section className="border-t border-rule">
          <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="type-display-m text-midnight">The shortlist</h2>
              <Link href="/projects?shortlisted=1" className="type-eyebrow text-blue hover:text-midnight">
                All shortlisted →
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

      {/* 4 — Market bar. The page's single blue field, so the headline is sand. */}
      {marketStats.length > 0 ? (
        <section className="bg-blue">
          <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
            <h2 className="type-display-m text-sand">The market, in numbers</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {marketStats.map((s) => (
                <StatBlock
                  key={s.id}
                  tone="sand"
                  value={s.value}
                  label={s.label}
                  source={`${s.source} · ${String(s.asOf).slice(0, 10)}`}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 5 — Mortgage teaser */}
      <section className="border-t border-rule">
        <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
          <div className="flex flex-col gap-3">
            <h2 className="type-display-m text-midnight">
              Financing for residents and non-residents
            </h2>
            <p className="type-body-l max-w-2xl text-midnight/70">
              Non-residents borrow up to {constants.ltv.nonResidentPct}% against completed UAE
              property. Start with the deposit.
            </p>
          </div>
          <MiniCalculator constants={constants} />
        </div>
      </section>

      {/* 6 — How we work */}
      <section className="border-t border-rule">
        <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
          <h2 className="type-display-m text-midnight">How we work</h2>
          <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
            {FIVE_STAGES.map((s) => (
              <li key={s.n} className="flex flex-col gap-2 border-t border-rule pt-4">
                <span className="type-micro text-midnight/40">{s.n}</span>
                <span className="type-display-s text-midnight">{s.title}</span>
                <span className="type-body-s text-midnight/70">{s.line}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 7 — Insights */}
      {articles.docs.length > 0 ? (
        <section className="border-t border-rule">
          <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="type-display-m text-midnight">Insights</h2>
              <Link href="/insights" className="type-eyebrow text-blue hover:text-midnight">
                All insights →
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {articles.docs.map((a) => (
                <Link
                  key={a.id}
                  href={`/insights/${a.slug}`}
                  className="group flex flex-col gap-2 border border-rule bg-white p-5 transition-colors duration-fast ease-brand hover:border-blue"
                >
                  <span className="type-micro uppercase text-midnight/50">{a.category}</span>
                  <span className="type-display-s text-midnight group-hover:text-blue">{a.title}</span>
                  {a.excerpt ? (
                    <span className="type-body-s text-midnight/70">{a.excerpt}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 8 — Contact band */}
      <section className="border-t border-rule">
        <div className="mx-auto px-4 py-16 md:px-6">
          <CropMarks className="mx-auto max-w-container">
            <div className="flex flex-col justify-between gap-8 bg-white p-8 md:flex-row md:items-center">
              <div className="flex flex-col gap-2">
                <h2 className="type-display-m text-midnight">Start with a brief</h2>
                <p className="type-body max-w-md text-midnight/70">
                  Twenty minutes, no deck. Budget, residency status, purpose, exit horizon.
                </p>
                {agent ? (
                  <p className="type-body-s mt-2 text-midnight/70">
                    {agent.name} · {agent.role} · RERA BRN {agent.brn}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-4">
                {waHref ? (
                  <a
                    href={waHref}
                    className="type-eyebrow bg-blue px-6 py-3.5 text-sand transition-colors duration-fast ease-brand hover:bg-midnight"
                  >
                    WhatsApp
                  </a>
                ) : null}
                <Link
                  href="/contact"
                  className="type-eyebrow border border-blue px-6 py-3.5 text-blue transition-colors duration-fast ease-brand hover:bg-blue hover:text-sand"
                >
                  Contact
                </Link>
              </div>
            </div>
          </CropMarks>
        </div>
      </section>
    </CompareProvider>
  );
}
