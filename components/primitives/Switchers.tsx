"use client";

import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { usePrefs } from "./PrefsProvider";
import { cn } from "@/lib/cn";

const utilitySelect =
  "type-micro cursor-pointer appearance-none border-0 bg-transparent uppercase text-midnight/70 transition-colors duration-fast ease-brand hover:text-blue focus:text-blue";

export function CurrencySwitcher() {
  const t = useTranslations("prefs");
  const { currency, setCurrency } = usePrefs();
  return (
    <label className="inline-flex items-center gap-1">
      <span className="sr-only">{t("currency")}</span>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className={utilitySelect}
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}

export function UnitSwitcher() {
  const t = useTranslations("prefs");
  const { unit, setUnit } = usePrefs();
  return (
    <div role="group" aria-label={t("units")} className="inline-flex items-center gap-2">
      {(["sqft", "sqm"] as const).map((u) => (
        <button
          key={u}
          type="button"
          aria-pressed={unit === u}
          onClick={() => setUnit(u)}
          className={cn(
            "type-micro uppercase transition-colors duration-fast ease-brand",
            unit === u ? "font-medium text-blue" : "text-midnight/65 hover:text-blue",
          )}
        >
          {t(u)}
        </button>
      ))}
    </div>
  );
}

export function LocaleSwitcher() {
  const t = useTranslations("prefs");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const other = locale === "en" ? "ar" : "en";
  return (
    <button
      type="button"
      aria-label={t("language")}
      onClick={() => router.replace(pathname, { locale: other })}
      className="type-micro uppercase text-midnight/70 transition-colors duration-fast ease-brand hover:text-blue"
    >
      {other === "ar" ? "العربية" : "English"}
    </button>
  );
}
