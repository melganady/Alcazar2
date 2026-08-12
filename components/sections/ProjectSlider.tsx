"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { MediaWell } from "@/components/primitives/MediaWell";

export type Slide = {
  slug: string;
  name: string;
  subCommunity: string;
  region: string;
  priceFromAED: number;
  priceLabel: string;
  planLabel: string;
  handover: string;
  developer: string;
  image?: string | null;
  alt?: string;
};

/**
 * Project slider for the home page.
 *
 * The brief bans carousels in the hero and bans scroll-jacking, so this is a
 * deliberate compromise: the hero stays typographic, and the slider sits below
 * as a browsable strip. Motion is limited to the brand's own translate + fade
 * at 300ms, autoplay stops permanently on any interaction, and the whole thing
 * becomes a static grid under prefers-reduced-motion.
 */
export function ProjectSlider({
  slides,
  autoplayMs = 6000,
}: {
  slides: Slide[];
  autoplayMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [engaged, setEngaged] = useState(false);
  const [reduced, setReduced] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const count = slides.length;
  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (reduced || engaged || count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), autoplayMs);
    return () => clearInterval(id);
  }, [reduced, engaged, count, autoplayMs]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      setEngaged(true);
      go(index + 1);
    }
    if (e.key === "ArrowLeft") {
      setEngaged(true);
      go(index - 1);
    }
  };

  if (count === 0) return null;

  // Reduced motion: no transform, no autoplay — a plain grid.
  if (reduced) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {slides.slice(0, 6).map((s) => (
          <SlideCard key={s.slug} slide={s} />
        ))}
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured projects"
      tabIndex={0}
      onKeyDown={onKey}
      onPointerDown={() => setEngaged(true)}
      className="flex flex-col gap-5 focus-visible:outline-2 focus-visible:outline-iron"
    >
      <div className="overflow-hidden">
        <div
          ref={trackRef}
          className="flex transition-transform duration-slow ease-brand"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <div
              key={s.slug}
              aria-hidden={i !== index}
              className="w-full shrink-0 px-0 sm:px-1"
            >
              <SlideCard slide={s} large />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2" role="tablist" aria-label="Choose project">
          {slides.map((s, i) => (
            <button
              key={s.slug}
              role="tab"
              aria-selected={i === index}
              aria-label={`${s.name}, ${s.subCommunity}`}
              onClick={() => {
                setEngaged(true);
                go(i);
              }}
              className={cn(
                "h-1 transition-all duration-fast ease-brand",
                i === index ? "w-8 bg-iron" : "w-4 bg-pine/50 hover:bg-pine",
              )}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <SliderButton label="Previous project" onClick={() => { setEngaged(true); go(index - 1); }}>
            ←
          </SliderButton>
          <SliderButton label="Next project" onClick={() => { setEngaged(true); go(index + 1); }}>
            →
          </SliderButton>
        </div>
      </div>
    </div>
  );
}

function SliderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="type-body flex h-9 w-9 items-center justify-center border border-pine text-iron transition-colors duration-fast ease-brand hover:bg-pine/25"
    >
      {children}
    </button>
  );
}

function SlideCard({ slide, large = false }: { slide: Slide; large?: boolean }) {
  return (
    <article className={cn("group border border-rule bg-linen", large && "sm:grid sm:grid-cols-2")}>
      <Link href={`/projects/${slide.slug}`} className="block">
        <MediaWell
          src={slide.image}
          alt={slide.alt ?? `${slide.name}, ${slide.subCommunity}`}
          label={slide.subCommunity}
          ratio={large ? "3/2" : "3/2"}
          sizes={large ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 640px) 100vw, 33vw"}
        />
      </Link>
      <div className={cn("flex flex-col justify-center gap-3 p-5", large && "sm:p-8")}>
        <p className="type-eyebrow text-iron/80">
          {slide.subCommunity}, {slide.region}
        </p>
        <h3 className={cn("text-iron", large ? "type-display-m" : "type-display-s")}>
          <Link href={`/projects/${slide.slug}`} className="underline-offset-4 group-hover:underline">
            {slide.name}
          </Link>
        </h3>
        <p className={cn("text-iron", large ? "type-display-s" : "type-body")}>
          {slide.priceFromAED > 0 ? (
            <>
              <span className="type-micro me-2 uppercase text-iron/80">From</span>
              {slide.priceLabel}
            </>
          ) : (
            <span className="type-body text-iron/80">Price on application</span>
          )}
        </p>
        <div className="mt-1 grid grid-cols-3 gap-3 border-t border-rule pt-3">
          {[
            ["Plan", slide.planLabel],
            ["Handover", slide.handover],
            ["Developer", slide.developer],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="type-micro uppercase text-iron/80">{k}</p>
              <p className="type-body-s truncate text-iron">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
