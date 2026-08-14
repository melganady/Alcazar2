import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { ProjectCard } from "@/components/project/ProjectCard";
import { FilterBar } from "@/components/project/FilterBar";
import { ControlsBar } from "@/components/project/ControlsBar";
import { CompareProvider } from "@/components/project/CompareProvider";
import { CompareTray } from "@/components/project/CompareControls";
import {
  getFilterOptions,
  queryProjects,
  type ProjectFilters,
} from "@/lib/projects";
import { alternates, shouldIndexFilteredView } from "@/lib/seo";

const FACET_KEYS = [
  "region", "community", "developer", "type", "beds", "priceMin", "priceMax",
  "handover", "postHandover", "status", "mortgageable", "goldenVisa", "shortlisted",
] as const;

/**
 * §10 — canonical on every filtered view, and noindex on thin or multi-facet
 * combinations so filter permutations cannot bloat the index.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ProjectFilters>;
}): Promise<Metadata> {
  const filters = await searchParams;
  const active = FACET_KEYS.filter((k) => filters[k]);
  const result = await queryProjects(filters);
  const index = shouldIndexFilteredView(active, result.totalDocs);

  const canonicalPath =
    active.length === 1 ? `/projects?${active[0]}=${filters[active[0]]}` : "/projects";

  return {
    title: "Off-plan projects in the UAE",
    description:
      "The REIN Investment shortlist and watchlist of pre-construction projects — payment plans, handover dates, developers, and financing status.",
    alternates: alternates(canonicalPath),
    robots: index ? undefined : { index: false, follow: true },
  };
}

export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<ProjectFilters>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const filters = await searchParams;
  const t = await getTranslations("projects");

  const [result, options] = await Promise.all([
    queryProjects(filters),
    getFilterOptions(),
  ]);

  // ?view=map only resolves when a token exists; otherwise it falls back to the
  // grid rather than landing the visitor on a placeholder.
  const mapEnabled = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
  const view =
    filters.view === "list" || (filters.view === "map" && mapEnabled) ? filters.view : "grid";

  const pageLink = (page: number) => {
    const next = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v != null) as [string, string][],
    );
    if (page > 1) next.set("page", String(page));
    else next.delete("page");
    const qs = next.toString();
    return `/projects${qs ? `?${qs}` : ""}`;
  };

  return (
    <CompareProvider>
      <PageHero eyebrow="REIN Investment" title={t("title")} support={t("intro")} compact />
      <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-12 md:px-6">
        <FilterBar options={options} />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p aria-live="polite" className="type-eyebrow text-navy/80">
            {t("results", { count: result.totalDocs })}
          </p>
          <ControlsBar />
        </div>

        {view === "map" ? (
          <div className="flex min-h-72 items-center justify-center border border-rule bg-surface p-10 text-center">
            <p className="type-body max-w-md text-navy/80">{t("mapPending")}</p>
          </div>
        ) : (
          <div
            className={
              view === "list"
                ? "flex flex-col gap-4"
                : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            }
          >
            {result.docs.map((p) => (
              <ProjectCard key={p.id} project={p} layout={view === "list" ? "list" : "grid"} />
            ))}
          </div>
        )}

        {result.totalPages > 1 ? (
          <nav aria-label="Pagination" className="flex items-center justify-center gap-6 pt-4">
            {result.hasPrevPage ? (
              <Link
                href={pageLink(result.page! - 1)}
                rel="prev"
                className="type-eyebrow text-navy/80 hover:underline hover:underline-offset-4"
              >
                {t("prevPage")}
              </Link>
            ) : null}
            <span className="type-body-s text-navy/80">
              {result.page} / {result.totalPages}
            </span>
            {result.hasNextPage ? (
              <Link
                href={pageLink(result.page! + 1)}
                rel="next"
                className="type-eyebrow text-navy/80 hover:underline hover:underline-offset-4"
              >
                {t("nextPage")}
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
      <CompareTray />
    </CompareProvider>
  );
}
