import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

function Mark({ position }: { position: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className={cn("absolute h-3 w-3 text-pine", position)}
    >
      <path
        d="M6 0v12M0 6h12"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

/**
 * The + corner marks from the brand guide — a signature element for panels.
 * Wraps content; marks sit just outside the content box.
 */
export function CropMarks({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative p-4", className)}>
      <Mark position="left-0 top-0" />
      <Mark position="right-0 top-0" />
      <Mark position="bottom-0 left-0" />
      <Mark position="bottom-0 right-0" />
      {children}
    </div>
  );
}
