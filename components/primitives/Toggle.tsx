"use client";

import { cn } from "@/lib/cn";

export function Toggle({
  checked,
  onChange,
  label,
  id,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  id: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 border transition-colors duration-fast ease-brand",
          checked ? "border-blue bg-blue" : "border-rule bg-white",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-1/2 h-4 w-4 -translate-y-1/2 transition-transform duration-fast ease-brand",
            checked
              ? "translate-x-[1.375rem] bg-sand rtl:-translate-x-[1.375rem]"
              : "translate-x-[0.1875rem] bg-midnight/30 rtl:-translate-x-[0.1875rem]",
          )}
        />
      </button>
      <label htmlFor={id} className="type-body-s cursor-pointer text-midnight">
        {label}
      </label>
    </div>
  );
}
