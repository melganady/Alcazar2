"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCompare } from "./CompareProvider";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";

export function CompareCheckbox({ slug, name }: { slug: string; name: string }) {
  const t = useTranslations("projects");
  const { toggle, has, items } = useCompare();
  const active = has(slug);
  return (
    <label
      className={cn(
        "type-micro inline-flex cursor-pointer items-center gap-1.5 uppercase transition-colors duration-fast ease-brand",
        active ? "text-navy" : "text-navy/80 hover:underline hover:underline-offset-4",
      )}
    >
      <input
        type="checkbox"
        checked={active}
        onChange={() => {
          toggle({ slug, name });
          if (!active) track({ name: "compare_added", slug, count: items.length + 1 });
        }}
        className="h-3.5 w-3.5 accent-[var(--rein-navy)]"
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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface">
      <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="type-eyebrow text-navy/80">
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
            className="type-micro uppercase text-navy/80 hover:underline hover:underline-offset-4"
          >
            {t("clear")}
          </button>
          <Link
            href={`/projects/compare?slugs=${items.map((i) => i.slug).join(",")}`}
            className={cn(
              "type-eyebrow px-4 py-2.5 transition-colors duration-fast ease-brand",
              items.length >= 2
                ? "bg-navy text-chalk hover:bg-navy/85"
                : "pointer-events-none bg-rule text-navy/40",
            )}
          >
            {t("compare")}
          </Link>
        </div>
      </div>
    </div>
  );
}
