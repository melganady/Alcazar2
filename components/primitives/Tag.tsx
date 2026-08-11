import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function Tag({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center type-eyebrow px-2.5 py-1 border",
        tone === "accent"
          ? "border-pine text-iron"
          : "border-rule text-iron/80",
        className,
      )}
    >
      {children}
    </span>
  );
}
