"use client";

import { cn } from "@/lib/cn";
import { useEffect, useRef, type ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  closeLabel = "Close",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  closeLabel?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // backdrop click
      }}
      className={cn(
        "w-full max-w-lg bg-linen p-0 text-iron backdrop:bg-iron/40",
        className,
      )}
    >
      <div className="flex flex-col gap-5 p-8">
        <div className="flex items-start justify-between gap-6">
          <h2 className="type-display-s text-iron">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="type-eyebrow -m-2 p-2 text-iron/80 transition-colors duration-fast ease-brand hover:text-iron"
          >
            <svg aria-hidden viewBox="0 0 12 12" className="h-3 w-3">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" fill="none" />
            </svg>
          </button>
        </div>
        <div className="type-body">{children}</div>
      </div>
    </dialog>
  );
}
