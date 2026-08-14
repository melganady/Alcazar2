import Image from "next/image";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { cn } from "@/lib/cn";

/**
 * The banner every interior page opens with.
 *
 * Two variants, chosen by whether an `image` is supplied:
 *
 * — With a licensed render, it's full-bleed with the same two-scrim
 *   treatment as the homepage hero: a diagonal wash keeps the bottom-left
 *   text corner reliably close to solid navy regardless of what's under it,
 *   a tighter bottom pass backs the caption row, and a soft text-shadow on
 *   every line is the second line of defence. Never guess at contrast —
 *   this is the one place it's worth repeating verbatim.
 *
 * — Without one (most CMS-only entities never get an uploaded photograph:
 *   mortgages, insights, the static pages), it falls back to a framed panel
 *   in the brand's own signature — crop marks and a steel field — rather
 *   than flat type on white. The empty state is a design decision, the same
 *   principle MediaWell already applies to a missing project render.
 */
export function PageHero({
  eyebrow,
  title,
  support,
  image,
  caption,
  compact = false,
  children,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  support?: ReactNode;
  image?: { url: string; alt: string } | null;
  /** Credit line under the CTAs — "Ellington Ocean House, Palm Jumeirah". */
  caption?: string;
  /** Shorter hero for pages with real content directly below the fold. */
  compact?: boolean;
  /** Extra content under the support copy — stat rows, CTAs, filters. */
  children?: ReactNode;
}) {
  const heights = compact
    ? "min-h-[20rem] md:min-h-[24rem]"
    : "min-h-[26rem] md:min-h-[30rem]";
  const shadowXs = "[text-shadow:0_1px_8px_rgba(0,0,0,0.45)]";
  const shadowSm = "[text-shadow:0_1px_10px_rgba(0,0,0,0.45)]";
  const shadowMd = "[text-shadow:0_2px_16px_rgba(0,0,0,0.45)]";

  if (image) {
    return (
      <section className="relative isolate overflow-hidden border-b border-rule">
        <div className="absolute inset-0 -z-10">
          <Image
            src={image.url}
            alt={image.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-navy via-navy/65 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-transparent to-transparent" />
        </div>
        <div
          className={cn(
            "mx-auto flex max-w-container flex-col items-start justify-end gap-5 px-4 py-14 md:px-6",
            heights,
          )}
        >
          <Eyebrow tone="reversed" className={shadowXs}>
            {eyebrow}
          </Eyebrow>
          <h1 className={cn("type-display-l max-w-3xl text-paper", shadowMd)}>{title}</h1>
          {support ? (
            <p className={cn("type-body-l max-w-2xl text-paper/95", shadowSm)}>{support}</p>
          ) : null}
          {children}
          {caption ? (
            <p className={cn("type-micro text-paper/80", shadowXs)}>{caption}</p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden border-b border-rule bg-steel/8">
      {["start-4 top-4", "end-4 top-4", "bottom-4 start-4", "bottom-4 end-4"].map((pos) => (
        <svg
          key={pos}
          aria-hidden
          viewBox="0 0 12 12"
          className={cn("absolute h-3 w-3 text-steel", pos)}
        >
          <path d="M6 0v12M0 6h12" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      ))}
      <div className="mx-auto flex max-w-container flex-col items-start gap-5 px-4 py-14 md:px-6 md:py-20">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="type-display-l max-w-3xl text-navy">{title}</h1>
        {support ? <p className="type-body-l max-w-2xl text-navy/80">{support}</p> : null}
        {children}
      </div>
    </section>
  );
}
