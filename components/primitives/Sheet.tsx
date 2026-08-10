"use client";

import { cn } from "@/lib/cn";
import { useEffect, type ReactNode } from "react";

/** Bottom sheet for mobile filters and nav. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  closeLabel = "Close",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  closeLabel?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={cn("fixed inset-0 z-50", !open && "pointer-events-none")}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={closeLabel}
        onClick={onClose}
        className={cn(
          "absolute inset-0 w-full bg-midnight/40 transition-opacity duration-slow ease-brand",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto bg-sand transition-transform duration-slow ease-brand",
          open ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-rule px-6 py-4">
          <h2 className="type-display-s text-midnight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="-m-2 p-2 text-midnight/60 transition-colors duration-fast ease-brand hover:text-blue"
          >
            <svg aria-hidden viewBox="0 0 12 12" className="h-3 w-3">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" fill="none" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
