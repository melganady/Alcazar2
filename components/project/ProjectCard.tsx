import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { formatBedrooms } from "@/lib/format";
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
        "group border border-rule bg-white",
        layout === "list" && "sm:grid sm:grid-cols-[minmax(0,16rem)_1fr]",
      )}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="relative block aspect-[3/2] overflow-hidden bg-sand"
      >
        {hero ? (
          <Image
            src={hero.url}
            alt={hero.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-display text-display-l font-light text-blue/30">
            Á
          </span>
        )}
        {shortlisted ? (
          <span
            title={t("shortlisted")}
            className="absolute end-3 top-3 flex h-7 w-7 items-center justify-center bg-blue font-display text-body-s text-sand"
          >
            Á
          </span>
        ) : null}
      </Link>

      <div className="flex flex-col gap-2 p-5">
        <p className="type-eyebrow text-midnight/65">
          {(project.propertyTypes ?? []).join(" · ")} ·{" "}
          {formatBedrooms(project.bedroomsMin, project.bedroomsMax)}
        </p>
        <h3 className="type-display-s text-midnight">
          <Link
            href={`/projects/${project.slug}`}
            className="transition-colors duration-fast ease-brand group-hover:text-blue"
          >
            {project.name}, {project.subCommunity}
          </Link>
        </h3>
        <p className="type-body-s text-midnight/65">
          {rel(project, "community")}, {project.emirate}
        </p>
        <p className="type-display-s text-midnight">
          <span className="type-micro me-2 uppercase text-midnight/65">{t("from")}</span>
          <PriceDisplay amountAED={project.priceFromAED} convertedClassName="type-body-s" />
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2 border-t border-rule pt-3">
          <div>
            <p className="type-micro uppercase text-midnight/65">{t("plan")}</p>
            <p className="type-body-s text-midnight">{project.paymentPlan?.label ?? "—"}</p>
          </div>
          <div>
            <p className="type-micro uppercase text-midnight/65">{t("developer")}</p>
            <p className="type-body-s truncate text-midnight">{rel(project, "developer")}</p>
          </div>
          <div>
            <p className="type-micro uppercase text-midnight/65">{t("handover")}</p>
            <p className="type-body-s text-midnight">
              {project.handoverQuarter} {project.handoverYear}
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
