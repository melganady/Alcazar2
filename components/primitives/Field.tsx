import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Field({ id, label, hint, error, className, ...props }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="type-body-s font-medium text-iron">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          "type-body w-full border bg-linen px-3.5 py-2.5 text-iron placeholder:text-iron/80 transition-colors duration-fast ease-brand",
          error ? "border-iron" : "border-rule focus:border-iron",
        )}
        {...props}
      />
      {hint && !error ? (
        <p id={`${id}-hint`} className="type-micro text-iron/80">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="type-micro font-medium text-iron">
          {error}
        </p>
      ) : null}
    </div>
  );
}
