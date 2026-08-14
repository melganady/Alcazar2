"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Sheet } from "@/components/primitives/Sheet";

export function MobileNav({
  links,
  menuLabel,
  closeLabel,
}: {
  links: Array<{ href: string; label: string }>;
  menuLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={menuLabel}
        aria-expanded={open}
        className="-m-2 p-2 text-navy underline-offset-4 transition-colors duration-fast ease-brand hover:underline"
      >
        <svg aria-hidden viewBox="0 0 20 14" className="h-3.5 w-5">
          <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" fill="none" />
        </svg>
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={menuLabel}
        closeLabel={closeLabel}
      >
        <nav aria-label={menuLabel} className="flex flex-col">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="type-display-s border-b border-rule py-4 text-navy underline-offset-4 transition-colors duration-fast ease-brand hover:underline"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </Sheet>
    </div>
  );
}
