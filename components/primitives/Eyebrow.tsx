import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("type-eyebrow flex items-center gap-2.5 text-iron/80", className)}>
      <span aria-hidden className="h-px w-6 bg-pine" />
      {children}
    </p>
  );
}
