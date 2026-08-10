"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCompare } from "./CompareProvider";
import { cn } from "@/lib/cn";

export function CompareCheckbox({ slug, name }: { slug: string; name: string }) {
  const t = useTranslations("projects");
  const { toggle, has } = useCompare();
  const active = has(slug);
  return (
    <label
      className={cn(
        "type-micro inline-flex cursor-pointer items-center gap-1.5 uppercase transition-colors duration-fast ease-brand",
        active ? "text-blue" : "text-midnight/50 hover:text-blue",
      )}
    >
      <input
        type="checkbox"
        checked={active}
        onChange={() => toggle({ slug, name })}
        className="h-3.5 w-3.5 accent-[var(--alcazar-blue)]"
      />
      {t("compare")}
    </label>
  );
}

export function CompareTray() {
  const t = useTranslations("projects");
  const { items, clear } = useCompare();
  if (items.length === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-white">
      <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="type-eyebrow text-midnight/60">
            {t("compareTitle")} · {items.length}/3
          </span>
          {items.map((i) => (
            <span key={i.slug} className="type-body-s border border-rule px-2 py-0.5">
              {i.name}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={clear}
            className="type-micro uppercase text-midnight/50 hover:text-blue"
          >
            {t("clear")}
          </button>
          <Link
            href={`/projects/compare?slugs=${items.map((i) => i.slug).join(",")}`}
            className={cn(
              "type-eyebrow px-4 py-2.5 transition-colors duration-fast ease-brand",
              items.length >= 2
                ? "bg-blue text-sand hover:bg-midnight"
                : "pointer-events-none bg-rule text-midnight/40",
            )}
          >
            {t("compare")}
          </Link>
        </div>
      </div>
    </div>
  );
}
