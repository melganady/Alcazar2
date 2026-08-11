"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Field } from "@/components/primitives/Field";
import { Select } from "@/components/primitives/Select";
import { maxLtvPct, monthlyRepayment } from "@/lib/mortgage/calc";
import type { MortgageConstants, ResidencyStatus } from "@/lib/mortgage/types";
import { formatAED } from "@/lib/currency";

/**
 * §6.5 home teaser: price + residency → deposit and indicative monthly.
 * Deep-links into the full calculator with the scenario preserved.
 */
export function MiniCalculator({ constants }: { constants: MortgageConstants }) {
  const locale = useLocale();
  const [price, setPrice] = useState(2_000_000);
  const [residency, setResidency] = useState<ResidencyStatus>("non-resident");

  const { pct } = maxLtvPct(constants, {
    residencyStatus: residency,
    propertyStatus: "ready",
    isFirstProperty: true,
    propertyPriceAED: price,
  });
  const loan = (price * pct) / 100;
  const deposit = price - loan;
  const monthly = monthlyRepayment(loan, 4.25, 25);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <Field
          id="mini-price"
          label="Property price (AED)"
          type="number"
          inputMode="numeric"
          min={200000}
          step={50000}
          value={price || ""}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <Select
          id="mini-residency"
          label="Residency status"
          value={residency}
          onChange={(e) => setResidency(e.target.value as ResidencyStatus)}
          options={[
            { value: "non-resident", label: "Non-resident" },
            { value: "resident-expat", label: "Resident expat" },
            { value: "uae-national", label: "UAE national" },
          ]}
        />
      </div>
      <div className="flex flex-col justify-between gap-4 border border-rule bg-white p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="type-micro uppercase text-midnight/50">Deposit from</p>
            <p className="type-display-s text-midnight">{formatAED(Math.round(deposit), locale)}</p>
          </div>
          <div>
            <p className="type-micro uppercase text-midnight/50">Indicative monthly</p>
            <p className="type-display-s text-midnight">{formatAED(Math.round(monthly), locale)}</p>
          </div>
        </div>
        <p className="type-micro text-midnight/50">
          At {pct}% LTV, 25 years, 4.25% indicative. Not an offer of finance.
        </p>
        <Link
          href={`/mortgages/calculator?price=${price}&residency=${residency}`}
          className="type-eyebrow self-start border border-blue px-4 py-2.5 text-blue transition-colors duration-fast ease-brand hover:bg-blue hover:text-sand"
        >
          Full calculator
        </Link>
      </div>
    </div>
  );
}
