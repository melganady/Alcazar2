import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function Tag({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "blue";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center type-eyebrow px-2.5 py-1 border",
        tone === "blue"
          ? "border-blue/40 text-blue"
          : "border-rule text-midnight/70",
        className,
      )}
    >
      {children}
    </span>
  );
}
