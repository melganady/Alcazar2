import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { MediaWell } from "@/components/primitives/MediaWell";
import { formatBedrooms, formatHandoverOrDash } from "@/lib/format";
import type { Project } from "@/payload-types";
import { PriceDisplay } from "./PriceDisplay";
import { CompareCheckbox } from "./CompareControls";

function heroUrl(project: Project): { url: string; alt: string } | null {
  const hero = project.media?.hero;
  if (hero && typeof hero === "object" && hero.url) {
    return { url: hero.url, alt: hero.alt ?? project.name };
  }
  return null;
}

function rel(project: Project, key: "developer" | "community"): string {
  const v = project[key];
  return v && typeof v === "object" ? v.name : "—";
}

export function ProjectCard({
  project,
  layout = "grid",
}: {
  project: Project;
  layout?: "grid" | "list";
}) {
  const t = useTranslations("projects");
  const hero = heroUrl(project);
  const shortlisted = project.alcazarStatus === "shortlisted";

  return (
    <article
      className={cn(
        "group border border-rule bg-surface transition-colors duration-fast ease-brand hover:border-steel",
        layout === "list" && "sm:grid sm:grid-cols-[minmax(0,16rem)_1fr]",
      )}
    >
      <Link href={`/projects/${project.slug}`} className="relative block">
        <MediaWell
          src={hero?.url}
          alt={hero?.alt ?? `${project.name}, ${project.subCommunity}`}
          label={project.subCommunity}
          ratio="3/2"
          imageClassName="transition-transform duration-slow ease-brand group-hover:scale-105"
        />
        {shortlisted ? (
          <span
            title={t("shortlisted")}
            className="absolute end-3 top-3 flex h-7 w-7 items-center justify-center border border-steel bg-paper font-display text-body-s font-bold text-navy"
          >
            R
          </span>
        ) : null}
      </Link>

      <div className="flex flex-col gap-2 p-5">
        <p className="type-eyebrow text-navy/80">
          {(project.propertyTypes ?? []).join(" · ")} ·{" "}
          {formatBedrooms(project.bedroomsMin, project.bedroomsMax)}
        </p>
        <h3 className="type-display-s text-navy">
          <Link
            href={`/projects/${project.slug}`}
            className="transition-colors duration-fast ease-brand group-hover:underline group-hover:underline-offset-4"
          >
            {project.name}, {project.subCommunity}
          </Link>
        </h3>
        <p className="type-body-s text-navy/80">
          {rel(project, "community")}, {project.region}
        </p>
        <p className="type-display-s text-navy">
          {project.priceFromAED > 0 ? (
            <>
              <span className="type-micro me-2 uppercase text-navy/80">{t("from")}</span>
              <PriceDisplay amountAED={project.priceFromAED} convertedClassName="type-body-s" />
            </>
          ) : (
            <span className="type-body text-navy/80">{t("priceOnApplication")}</span>
          )}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2 border-t border-rule pt-3">
          <div>
            <p className="type-micro uppercase text-navy/80">{t("plan")}</p>
            <p className="type-body-s text-navy">{project.paymentPlan?.label ?? "—"}</p>
          </div>
          <div>
            <p className="type-micro uppercase text-navy/80">{t("developer")}</p>
            <p className="type-body-s truncate text-navy">{rel(project, "developer")}</p>
          </div>
          <div>
            <p className="type-micro uppercase text-navy/80">{t("handover")}</p>
            <p className="type-body-s text-navy">
              {formatHandoverOrDash(project.handoverQuarter, project.handoverYear)}
            </p>
          </div>
        </div>
        <div className="mt-1">
          <CompareCheckbox slug={project.slug} name={project.name} />
        </div>
      </div>
    </article>
  );
}
