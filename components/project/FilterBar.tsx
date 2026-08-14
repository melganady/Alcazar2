"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Select } from "@/components/primitives/Select";
import { Toggle } from "@/components/primitives/Toggle";
import { RangeSlider } from "@/components/primitives/RangeSlider";
import { Sheet } from "@/components/primitives/Sheet";
import { Button } from "@/components/primitives/Button";
import { track } from "@/lib/analytics";

export type FilterOptions = {
  communities: Array<{ slug: string; name: string; region: string }>;
  developers: Array<{ slug: string; name: string }>;
};

const PRICE_MIN = 500_000;
const PRICE_MAX = 20_000_000;
const PRICE_STEP = 100_000;

const EMIRATES = ["Dubai", "Abu Dhabi", "Ras Al Khaimah", "Sharjah", "Ajman", "UAQ", "Fujairah"];
const TYPES = ["Apartment", "Penthouse", "Townhouse", "Villa", "Sky Villa", "Duplex", "Mansion", "Hotel Room", "Office"];
const STATUSES = ["pre-launch", "launched", "under-construction", "nearing-handover", "handed-over", "sold-out"];
const YEARS = [2026, 2027, 2028, 2029];

export function FilterBar({ options }: { options: FilterOptions }) {
  const t = useTranslations("projects");
  const tp = useTranslations("project");
  const tn = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [, startTransition] = useTransition();

  const get = useCallback((key: string) => params.get(key) ?? "", [params]);

  const set = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      next.delete("page"); // any filter change resets pagination
      track({ name: "filter_applied", facets: Object.fromEntries(next.entries()) });
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  const clear = useCallback(() => {
    const keep = new URLSearchParams();
    const view = params.get("view");
    if (view) keep.set("view", view);
    startTransition(() => {
      router.replace(`${pathname}?${keep.toString()}`, { scroll: false });
    });
  }, [params, pathname, router]);

  const emirate = get("emirate");
  const communities = useMemo(
    () => options.communities.filter((c) => !emirate || c.region === emirate),
    [options.communities, emirate],
  );

  const priceMin = Number(get("priceMin")) || PRICE_MIN;
  const priceMax = Number(get("priceMax")) || PRICE_MAX;

  const activeCount = [
    "emirate", "community", "developer", "type", "beds", "priceMin", "priceMax",
    "handover", "postHandover", "status", "mortgageable", "goldenVisa", "shortlisted",
  ].filter((k) => params.get(k)).length;

  const controls = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Select
        id="f-emirate"
        label={t("emirate")}
        value={emirate}
        onChange={(e) => set({ region: e.target.value, community: "" })}
        options={[{ value: "", label: t("any") }, ...EMIRATES.map((v) => ({ value: v, label: v }))]}
      />
      <Select
        id="f-community"
        label={t("community")}
        value={get("community")}
        onChange={(e) => set({ community: e.target.value })}
        options={[
          { value: "", label: t("any") },
          ...communities.map((c) => ({ value: c.slug, label: c.name })),
        ]}
      />
      <Select
        id="f-developer"
        label={t("developer")}
        value={get("developer")}
        onChange={(e) => set({ developer: e.target.value })}
        options={[
          { value: "", label: t("any") },
          ...options.developers.map((d) => ({ value: d.slug, label: d.name })),
        ]}
      />
      <Select
        id="f-type"
        label={t("propertyType")}
        value={get("type")}
        onChange={(e) => set({ type: e.target.value })}
        options={[{ value: "", label: t("any") }, ...TYPES.map((v) => ({ value: v, label: v }))]}
      />
      <Select
        id="f-beds"
        label={t("bedrooms")}
        value={get("beds")}
        onChange={(e) => set({ beds: e.target.value })}
        options={[
          { value: "", label: t("any") },
          { value: "0", label: t("studio") },
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: t("bedsPlus") },
        ]}
      />
      <Select
        id="f-handover"
        label={t("handoverYear")}
        value={get("handover")}
        onChange={(e) => set({ handover: e.target.value })}
        options={[
          { value: "", label: t("any") },
          ...YEARS.map((y) => ({ value: String(y), label: String(y) })),
        ]}
      />
      <Select
        id="f-status"
        label={t("status")}
        value={get("status")}
        onChange={(e) => set({ status: e.target.value })}
        options={[{ value: "", label: t("any") }, ...STATUSES.map((v) => ({ value: v, label: v }))]}
      />
      <Select
        id="f-mortgageable"
        label={t("mortgageable")}
        value={get("mortgageable")}
        onChange={(e) => set({ mortgageable: e.target.value })}
        options={[
          { value: "", label: t("any") },
          { value: "yes", label: tp("mortgageableYes") },
          { value: "at-handover-only", label: tp("mortgageableAtHandover") },
          { value: "no", label: tp("mortgageableNo") },
        ]}
      />
      <div className="sm:col-span-2">
        <RangeSlider
          label={t("priceRange")}
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          valueMin={priceMin}
          valueMax={priceMax}
          onChange={({ min, max }) =>
            set({
              priceMin: min > PRICE_MIN ? String(min) : "",
              priceMax: max < PRICE_MAX ? String(max) : "",
            })
          }
          format={(v) => `${(v / 1_000_000).toFixed(1)}M`}
        />
      </div>
      <div className="flex flex-col justify-end gap-3 sm:col-span-2">
        <Toggle
          id="f-post-handover"
          checked={get("postHandover") === "1"}
          onChange={(v) => set({ postHandover: v ? "1" : "" })}
          label={t("postHandover")}
        />
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Toggle
            id="f-golden-visa"
            checked={get("goldenVisa") === "1"}
            onChange={(v) => set({ goldenVisa: v ? "1" : "" })}
            label={t("goldenVisa")}
          />
          <Toggle
            id="f-shortlisted"
            checked={get("shortlisted") === "1"}
            onChange={(v) => set({ shortlisted: v ? "1" : "" })}
            label={t("shortlistedOnly")}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden border border-rule bg-surface p-5 lg:block">
        {controls}
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clear}
            className="type-micro mt-4 uppercase text-navy/80 transition-colors duration-fast ease-brand hover:text-navy hover:underline hover:underline-offset-4"
          >
            {t("clear")} ({activeCount})
          </button>
        ) : null}
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>
          {t("filters")}
          {activeCount > 0 ? ` · ${activeCount}` : ""}
        </Button>
        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t("filters")}>
          {controls}
          <div className="mt-6 flex gap-3">
            <Button onClick={() => setSheetOpen(false)}>{tn("close")}</Button>
            <Button variant="ghost" onClick={clear}>
              {t("clear")}
            </Button>
          </div>
        </Sheet>
      </div>
    </>
  );
}
