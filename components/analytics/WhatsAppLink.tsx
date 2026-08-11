"use client";

import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/** §12 whatsapp_click — the primary mobile CTA, so it needs its own event. */
export function WhatsAppLink({
  href,
  source,
  slug,
  children,
  className,
}: {
  href: string;
  source: string;
  slug?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      onClick={() => track({ name: "whatsapp_click", source, slug })}
      className={cn(
        "type-eyebrow bg-blue px-6 py-3.5 text-sand transition-colors duration-fast ease-brand hover:bg-midnight",
        className,
      )}
    >
      {children}
    </a>
  );
}
