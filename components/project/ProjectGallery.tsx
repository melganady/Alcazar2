"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type GalleryImage = { url: string; alt: string; width?: number; height?: number };

/**
 * §6.2 — the project gallery. Developer-supplied imagery only; the caption
 * strip carries the permit number and the developer credit, because a licensed
 * render still has to say whose it is and under which advertising permit it
 * appears.
 *
 * Motion stays inside the brand: a fade and an 8px rise, 300ms, no parallax.
 * The lightbox traps focus, closes on Escape, and restores focus on exit.
 */
export function ProjectGallery({
  images,
  permitNumber,
  developer,
}: {
  images: GalleryImage[];
  permitNumber?: string | null;
  developer?: string | null;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open !== null && !dialog.open) dialog.showModal();
    if (open === null && dialog.open) {
      dialog.close();
      openerRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft")
        setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  if (images.length === 0) return null;

  const [hero, ...rest] = images;

  const openAt = (index: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
    openerRef.current = e.currentTarget;
    setOpen(index);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Hero — the LCP element, so it loads eagerly */}
      <button
        type="button"
        onClick={openAt(0)}
        aria-label={`${hero.alt} — open gallery`}
        className="group relative block aspect-[21/9] w-full overflow-hidden bg-surface"
      >
        <Image
          src={hero.url}
          alt={hero.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {permitNumber || developer ? (
          <span className="type-micro absolute bottom-0 end-0 bg-paper/90 px-3 py-1.5 text-navy/80">
            {permitNumber ? `Trakheesi permit no. ${permitNumber}` : null}
            {permitNumber && developer ? " · " : null}
            {developer}
          </span>
        ) : null}
      </button>

      {/* Everything else — the 7-of-8 that used to be invisible */}
      {rest.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {rest.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={openAt(i + 1)}
                aria-label={`${img.alt} — open gallery`}
                className="group relative block aspect-[4/3] w-full overflow-hidden bg-surface"
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-opacity duration-slow ease-brand group-hover:opacity-85"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="type-micro text-navy/80">
        {images.length} {images.length === 1 ? "render" : "renders"} supplied under licence
        {developer ? ` · ${developer}` : ""}. Renders are the developer&rsquo;s and are
        indicative; finishes and views are subject to change.
      </p>

      {/* Lightbox */}
      <dialog
        ref={dialogRef}
        onClose={close}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        aria-label="Project gallery"
        className="max-h-[92vh] w-full max-w-6xl bg-transparent p-0 backdrop:bg-navy/80"
      >
        {open !== null ? (
          <div className="flex flex-col gap-3">
            <div className="relative aspect-[3/2] w-full bg-navy">
              <Image
                src={images[open].url}
                alt={images[open].alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <div className="flex items-center justify-between gap-4 bg-paper px-4 py-3">
              <p className="type-body-s text-navy">
                {images[open].alt}
                <span className="ms-3 text-navy/80">
                  {open + 1} / {images.length}
                </span>
              </p>
              <div className="flex gap-2">
                <LightboxButton
                  label="Previous image"
                  onClick={() => setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length))}
                >
                  ←
                </LightboxButton>
                <LightboxButton
                  label="Next image"
                  onClick={() => setOpen((i) => (i === null ? i : (i + 1) % images.length))}
                >
                  →
                </LightboxButton>
                <LightboxButton label="Close gallery" onClick={close}>
                  ✕
                </LightboxButton>
              </div>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}

function LightboxButton({
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
      className={cn(
        "type-body flex h-9 w-9 items-center justify-center border border-steel text-navy",
        "transition-colors duration-fast ease-brand hover:bg-steel/25",
      )}
    >
      {children}
    </button>
  );
}
