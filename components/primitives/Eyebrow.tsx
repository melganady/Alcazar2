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
    <p className={cn("type-eyebrow text-iron/80", className)}>{children}</p>
  );
}
