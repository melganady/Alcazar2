import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

type LogoProps = {
  /** blue-on-sand (default) or sand-on-blue — the only two treatments (§1). */
  reversed?: boolean;
  /** Bilingual lockup for the ar locale. */
  bilingual?: boolean;
  className?: string;
};

/**
 * Wordmark. Clearspace = cap-height of the A, implemented as padding driven
 * by --logo-clearspace so a parent's layout can never violate it.
 * Below 120px of available width, render <Monogram /> instead.
 */
export function Logo({ reversed = false, bilingual = false, className }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex flex-col items-start leading-none",
        reversed ? "text-sand" : "text-blue",
        className,
      )}
      style={{ padding: "var(--logo-clearspace)" }}
    >
      <span className="font-display text-display-m font-light uppercase tracking-hero">
        {SITE.name}
      </span>
      {bilingual ? (
        <span className="type-body-s mt-1 self-stretch text-center opacity-80">
          {SITE.nameAr}
        </span>
      ) : null}
    </span>
  );
}

/** Á monogram — favicon, avatars, collapsed mobile nav. */
export function Monogram({ reversed = false, className }: { reversed?: boolean; className?: string }) {
  return (
    <span
      aria-label={SITE.name}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center font-display text-display-s font-normal",
        reversed ? "bg-sand text-blue" : "bg-blue text-sand",
        className,
      )}
    >
      Á
    </span>
  );
}
