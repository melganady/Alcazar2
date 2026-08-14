"use client";

import { cn } from "@/lib/cn";
import { useId } from "react";

/**
 * Dual-thumb range (e.g. price, size). Two native inputs overlaid —
 * fully keyboard operable, announced as min/max of the labelled group.
 */
export function RangeSlider({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChange,
  label,
  format = (v) => String(v),
  className,
}: {
  min: number;
  max: number;
  step?: number;
  valueMin: number;
  valueMax: number;
  onChange: (next: { min: number; max: number }) => void;
  label: string;
  format?: (v: number) => string;
  className?: string;
}) {
  const id = useId();
  const lowPct = ((valueMin - min) / (max - min)) * 100;
  const highPct = ((valueMax - min) / (max - min)) * 100;

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      className={cn("flex flex-col gap-2", className)}
    >
      <div className="flex items-baseline justify-between">
        <span id={`${id}-label`} className="type-body-s font-medium text-navy">
          {label}
        </span>
        <span className="type-body-s text-navy/80">
          {format(valueMin)} — {format(valueMax)}
        </span>
      </div>
      <div className="relative h-6">
        <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-rule" />
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-navy"
          style={{ insetInlineStart: `${lowPct}%`, width: `${highPct - lowPct}%` }}
        />
        <input
          type="range"
          aria-label={`${label} minimum`}
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={(e) =>
            onChange({
              min: Math.min(Number(e.target.value), valueMax - step),
              max: valueMax,
            })
          }
          className="range-thumb pointer-events-none absolute top-0 h-6 w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          aria-label={`${label} maximum`}
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={(e) =>
            onChange({
              min: valueMin,
              max: Math.max(Number(e.target.value), valueMin + step),
            })
          }
          className="range-thumb pointer-events-none absolute top-0 h-6 w-full appearance-none bg-transparent"
        />
      </div>
    </div>
  );
}
