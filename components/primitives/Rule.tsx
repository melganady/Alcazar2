import { cn } from "@/lib/cn";

/** 1px hairline — the deepest "shadow" this brand allows. */
export function Rule({ className }: { className?: string }) {
  return <hr className={cn("h-px w-full border-0 bg-rule", className)} />;
}
