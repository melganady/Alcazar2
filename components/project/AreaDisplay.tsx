"use client";

import { useLocale } from "next-intl";
import { usePrefs } from "@/components/primitives/PrefsProvider";
import { formatArea } from "@/lib/units";

export function AreaDisplay({ sqft, sqftMax }: { sqft: number; sqftMax?: number | null }) {
  const { unit } = usePrefs();
  const locale = useLocale();
  if (sqftMax && sqftMax !== sqft) {
    return (
      <>
        {formatArea(sqft, unit, locale)} – {formatArea(sqftMax, unit, locale)}
      </>
    );
  }
  return <>{formatArea(sqft, unit, locale)}</>;
}
