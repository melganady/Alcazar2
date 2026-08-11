import { cn } from "@/lib/cn";

/**
 * Numbers first, adjectives last. Value renders in display type;
 * no animated counters. `reversed` is for stats sitting on an iron field.
 */
export function StatBlock({
  value,
  label,
  source,
  tone = "default",
  className,
}: {
  value: string;
  label: string;
  source?: string; // "DLD, Jul 2026" — required wherever the stat is a market claim
  tone?: "default" | "reversed";
  className?: string;
}) {
  const valueColor =
    tone === "reversed" ? "text-ash" : "text-iron";
  const labelColor = tone === "reversed" ? "text-ash/80" : "text-iron/80";
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className={cn("type-display-m", valueColor)}>{value}</span>
      <span className={cn("type-eyebrow", labelColor)}>{label}</span>
      {source ? (
        <span className={cn("type-micro", labelColor)}>{source}</span>
      ) : null}
    </div>
  );
}
