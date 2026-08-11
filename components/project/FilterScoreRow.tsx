import { useTranslations } from "next-intl";
import type { Project } from "@/payload-types";

const KEYS = [
  ["developerRecord", "scoreDeveloperRecord"],
  ["regulatoryStanding", "scoreRegulatoryStanding"],
  ["priceVsComparables", "scorePriceVsComparables"],
  ["paymentStructure", "scorePaymentStructure"],
  ["supplyInWindow", "scoreSupplyInWindow"],
  ["exitTerms", "scoreExitTerms"],
  ["runningCost", "scoreRunningCost"],
  ["unitQuality", "scoreUnitQuality"],
] as const;

/** §6.8 — the eight tests as a small 8-bar row. Static, no animation. */
export function FilterScoreRow({
  scores,
}: {
  scores: NonNullable<Project["alcazarFilterScores"]>;
}) {
  const t = useTranslations("project");
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
      {KEYS.map(([key, labelKey]) => {
        const value = scores[key] ?? 0;
        return (
          <div key={key} className="flex flex-col gap-1.5">
            <dt className="type-micro uppercase text-midnight/65">{t(labelKey)}</dt>
            <dd className="flex items-center gap-1" aria-label={`${value} / 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={
                    n <= value ? "h-1.5 w-5 bg-blue" : "h-1.5 w-5 bg-rule"
                  }
                />
              ))}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
