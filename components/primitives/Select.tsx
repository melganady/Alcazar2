import { cn } from "@/lib/cn";
import type { SelectHTMLAttributes } from "react";

type SelectProps = {
  id: string;
  label?: string;
  options: Array<{ value: string; label: string }>;
} & SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ id, label, options, className, ...props }: SelectProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={id} className="type-body-s font-medium text-navy">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={id}
          className="type-body w-full appearance-none border border-rule bg-surface py-2.5 pe-9 ps-3.5 text-navy transition-colors duration-fast ease-brand focus:border-navy"
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 10 6"
          className="pointer-events-none absolute end-3.5 top-1/2 h-1.5 w-2.5 -translate-y-1/2 text-navy/80"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" fill="none" />
        </svg>
      </div>
    </div>
  );
}
