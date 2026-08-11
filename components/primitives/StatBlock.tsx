import { cn } from "@/lib/cn";

/**
 * Numbers first, adjectives last. Value renders in display type;
 * no animated counters (§1 Motion).
 */
export function StatBlock({
  value,
  label,
  source,
  tone = "midnight",
  className,
}: {
  value: string;
  label: string;
  source?: string; // "DLD, Jul 2026" — required wherever the stat is a market claim
  tone?: "midnight" | "blue" | "sand";
  className?: string;
}) {
  const valueColor =
    tone === "sand" ? "text-sand" : tone === "blue" ? "text-blue" : "text-midnight";
  const labelColor = tone === "sand" ? "text-sand/80" : "text-midnight/65";
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
