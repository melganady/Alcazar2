"use client";

import { usePrefs } from "@/components/primitives/PrefsProvider";
import { formatAED, formatConverted } from "@/lib/currency";
import { useLocale } from "next-intl";
import { cn } from "@/lib/cn";

/** AED always shown; converted figure follows the active currency (§9). */
export function PriceDisplay({
  amountAED,
  className,
  convertedClassName,
}: {
  amountAED: number;
  className?: string;
  convertedClassName?: string;
}) {
  const { currency } = usePrefs();
  const locale = useLocale();
  const converted = formatConverted(amountAED, currency, locale);
  return (
    <span className={className}>
      {formatAED(amountAED, locale)}
      {converted ? (
        <span className={cn("text-midnight/65", convertedClassName)}> {converted}</span>
      ) : null}
    </span>
  );
}
