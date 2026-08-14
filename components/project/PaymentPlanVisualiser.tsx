"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePrefs } from "@/components/primitives/PrefsProvider";
import {
  conversionNote,
  formatAED,
  formatConverted,
} from "@/lib/currency";
import { Field } from "@/components/primitives/Field";
import { track } from "@/lib/analytics";

type Milestone = { label: string; pct: number; trigger: string };

/**
 * §6.4 — horizontal milestone timeline + table. The user enters their unit
 * price and every instalment recomputes in AED and the active currency.
 * No animation on the numbers (§1 Motion).
 */
export function PaymentPlanVisualiser({
  milestones,
  defaultPriceAED,
  planLabel,
  slug,
}: {
  milestones: Milestone[];
  defaultPriceAED: number;
  planLabel: string;
  slug: string;
}) {
  const t = useTranslations("project");
  const locale = useLocale();
  const { currency } = usePrefs();
  const [price, setPrice] = useState(defaultPriceAED);

  const note = conversionNote(currency);
  const total = milestones.reduce((s, m) => s + m.pct, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-xs">
        <Field
          id="plan-price"
          label={t("unitPriceLabel")}
          type="number"
          inputMode="numeric"
          min={100000}
          step={50000}
          value={price || ""}
          onChange={(e) => {
            const next = Number(e.target.value);
            setPrice(next);
            track({ name: "payment_plan_interacted", slug, unitPriceAED: next });
          }}
        />
      </div>

      {/* Timeline */}
      <div className="flex h-16 w-full overflow-hidden border border-rule bg-surface" aria-hidden>
        {milestones.map((m, i) => (
          <div
            key={i}
            style={{ width: `${(m.pct / total) * 100}%` }}
            className={
              i % 2 === 0
                ? "flex flex-col justify-center gap-0.5 bg-steel/18 px-2"
                : "flex flex-col justify-center gap-0.5 bg-surface px-2"
            }
          >
            <span className="type-micro truncate uppercase text-navy/80">{m.label}</span>
            <span className="type-body-s font-medium text-navy">{m.pct}%</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse">
          <caption className="sr-only">{planLabel}</caption>
          <thead>
            <tr className="border-b border-rule">
              <th className="type-eyebrow py-2 pe-4 text-start text-navy/80">{t("milestone")}</th>
              <th className="type-eyebrow py-2 pe-4 text-start text-navy/80">{t("trigger")}</th>
              <th className="type-eyebrow py-2 pe-4 text-end text-navy/80">{t("share")}</th>
              <th className="type-eyebrow py-2 text-end text-navy/80">{t("amount")}</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map((m, i) => {
              const amount = Math.round((price * m.pct) / 100);
              const converted = formatConverted(amount, currency, locale);
              return (
                <tr key={i} className="border-b border-rule/60">
                  <td className="type-body-s py-2.5 pe-4 font-medium text-navy">{m.label}</td>
                  <td className="type-body-s py-2.5 pe-4 text-navy/80">{m.trigger}</td>
                  <td className="type-body-s py-2.5 pe-4 text-end text-navy">{m.pct}%</td>
                  <td className="type-body-s py-2.5 text-end text-navy">
                    {formatAED(amount, locale)}
                    {converted ? (
                      <span className="ms-2 text-navy/80">{converted}</span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {note ? <p className="type-micro text-navy/80">{note}</p> : null}
    </div>
  );
}
