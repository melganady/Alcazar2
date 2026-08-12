"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

/**
 * Persistent call and WhatsApp buttons.
 *
 * Most of this audience is on a phone, and the enquiry points otherwise sit at
 * the bottom of a long listing page. These follow the scroll so the desk is
 * always one tap away.
 *
 * Hidden until the reader has moved past the hero: appearing immediately
 * covers the headline on a small screen, and someone who has scrolled has
 * shown enough interest to be worth interrupting.
 */
export function FloatingContact({
  phone,
  waHref,
  callLabel,
  whatsappLabel,
}: {
  phone?: string | null;
  waHref?: string | null;
  callLabel: string;
  whatsappLabel: string;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!phone && !waHref) return null;

  return (
    <div
      className={`fixed bottom-5 z-40 flex flex-col gap-3 transition-all duration-slow ease-brand end-5 ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      {waHref ? (
        <a
          href={waHref}
          onClick={() => track({ name: "whatsapp_click", source: "floating" })}
          aria-label={whatsappLabel}
          title={whatsappLabel}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-pine text-frost shadow-lg ring-1 ring-iron/10 transition-transform duration-fast ease-brand hover:scale-105"
        >
          {/* WhatsApp glyph, drawn rather than loaded, so the button costs no request. */}
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden focusable="false">
            <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z" />
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.87 9.87 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.02h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.17 8.17 0 0 1-1.25-4.36c0-4.54 3.7-8.23 8.24-8.23a8.23 8.23 0 0 1 .01 16.46Z" />
          </svg>
        </a>
      ) : null}

      {phone ? (
        <a
          href={`tel:${phone.replace(/\s/g, "")}`}
          onClick={() => track({ name: "call_click", source: "floating" })}
          aria-label={callLabel}
          title={callLabel}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-iron text-ash shadow-lg ring-1 ring-iron/10 transition-transform duration-fast ease-brand hover:scale-105"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden focusable="false">
            <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z" />
          </svg>
        </a>
      ) : null}
    </div>
  );
}
