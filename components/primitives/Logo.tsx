import Image from "next/image";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

import wordmarkNavy from "@/public/brand/wordmark-navy.png";
import wordmarkWhite from "@/public/brand/wordmark-white.png";

type LogoProps = {
  /** navy-on-light (default) or reversed-on-navy — the only two treatments. */
  reversed?: boolean;
  /**
   * Kept for call-site compatibility. The identity carries one wordmark, in
   * Latin script, across both locales — so this no longer changes the lockup.
   */
  bilingual?: boolean;
  className?: string;
};

/**
 * Wordmark. The mark is supplied artwork and is never re-typed: REIN stacks
 * over Investment against a single full-height stem — the shared vertical of
 * the I — and re-setting it in a webfont would lose that construction.
 * Clear space on all sides equals the stem's width x 4, implemented as padding
 * driven by --logo-clearspace so a parent's layout can never violate it.
 *
 * Below 96px wide on screen (28mm in print) the tagline comes off and the
 * wordmark stands alone, which is what this component renders in every case.
 */
export function Logo({ reversed = false, className }: LogoProps) {
  return (
    <span
      className={cn("inline-flex items-center leading-none", className)}
      style={{ padding: "var(--logo-clearspace)" }}
    >
      <Image
        src={reversed ? wordmarkWhite : wordmarkNavy}
        alt={SITE.name}
        priority
        className="block h-9 w-auto"
      />
    </span>
  );
}

/**
 * R mark — favicon, avatars, collapsed mobile nav. The wordmark is a 3.4:1
 * horizontal lockup and goes illegible in a square, so the initial stands in
 * for it below that size. Never used where the full wordmark fits.
 */
export function Monogram({
  reversed = false,
  className,
}: {
  reversed?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-label={SITE.name}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center font-display text-display-s font-bold",
        reversed ? "bg-chalk text-navy" : "bg-navy text-chalk",
        className,
      )}
    >
      R
    </span>
  );
}
