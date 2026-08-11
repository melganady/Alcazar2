import { cn } from "@/lib/cn";

/**
 * 1px hairline — the deepest "shadow" this brand allows.
 * `accent` draws it in pine smoke: the one accent, at most one rule, tag or
 * line per composition.
 */
export function Rule({
  className,
  accent = false,
}: {
  className?: string;
  accent?: boolean;
}) {
  return (
    <hr
      className={cn("h-px w-full border-0", accent ? "bg-pine" : "bg-rule", className)}
    />
  );
}
