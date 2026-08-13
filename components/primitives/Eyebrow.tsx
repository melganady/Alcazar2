import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/** `reversed` is for an eyebrow sitting on an iron field or a photo. */
export function Eyebrow({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "reversed";
}) {
  const textColor = tone === "reversed" ? "text-frost/90" : "text-iron/80";
  return (
    <p className={cn("type-eyebrow flex items-center gap-2.5", textColor, className)}>
      <span aria-hidden className="h-px w-6 bg-pine" />
      {children}
    </p>
  );
}
