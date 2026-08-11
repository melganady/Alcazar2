"use client";

import { useCallback, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

/** Sort select + grid/list/map view toggle. Both are URL state. */
export function ControlsBar() {
  const t = useTranslations("projects");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const set = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      if (key === "sort") next.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  const view = params.get("view") ?? "grid";
  const sort = params.get("sort") ?? "relevance";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div role="group" aria-label={t("viewGrid")} className="flex items-center gap-4">
        {(["grid", "list", "map"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => set("view", v === "grid" ? "" : v)}
            className={cn(
              "type-eyebrow transition-colors duration-fast ease-brand",
              view === v ? "text-iron" : "text-iron/80 hover:underline hover:underline-offset-4",
            )}
          >
            {t(v === "grid" ? "viewGrid" : v === "list" ? "viewList" : "viewMap")}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2">
        <span className="type-micro uppercase text-iron/80">{t("sort")}</span>
        <select
          value={sort}
          onChange={(e) => set("sort", e.target.value === "relevance" ? "" : e.target.value)}
          className="type-body-s cursor-pointer appearance-none border-0 bg-transparent text-iron underline-offset-4 hover:underline"
        >
          <option value="relevance">{t("sortRelevance")}</option>
          <option value="price-asc">{t("sortPriceAsc")}</option>
          <option value="price-desc">{t("sortPriceDesc")}</option>
          <option value="handover">{t("sortHandover")}</option>
          <option value="newest">{t("sortNewest")}</option>
        </select>
      </label>
    </div>
  );
}
