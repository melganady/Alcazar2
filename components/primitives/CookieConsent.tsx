"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { CONSENT_COOKIE } from "@/lib/analytics";

/**
 * §11.8 — reject-all is exactly as prominent as accept-all (same size, same
 * weight, same visual treatment), and no non-essential script fires before a
 * choice is made. The banner itself sets only this one first-party cookie.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const decided = document.cookie
      .split("; ")
      .some((c) => c.startsWith(`${CONSENT_COOKIE}=`));
    if (!decided) setVisible(true);
  }, []);

  const decide = (value: "accepted" | "rejected") => {
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=15552000; samesite=lax`;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-surface"
    >
      <div className="mx-auto flex max-w-container flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="type-body-s max-w-2xl text-navy/80">
          We use essential cookies to run the site, and optional analytics
          cookies to see which pages actually help. Nothing optional runs until
          you choose.{" "}
          <Link href="/legal/cookies" className="text-navy underline underline-offset-4">
            Cookie policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => decide("rejected")}
            className="type-eyebrow border border-navy px-5 py-3 text-navy transition-colors duration-fast ease-brand hover:bg-navy hover:text-chalk"
          >
            Reject all
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="type-eyebrow border border-navy px-5 py-3 text-navy transition-colors duration-fast ease-brand hover:bg-navy hover:text-chalk"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
