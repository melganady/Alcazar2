import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The image container used everywhere a project render sits.
 *
 * When licensed media exists it renders the photograph. When it does not — the
 * state the site is in until developer packs arrive — it renders a composed
 * brand field rather than a broken-looking gap: linen ground, ash-wood
 * monogram, crop marks, and the subject named in eyebrow type. A visitor reads
 * it as a design decision, which it is, not as a missing asset.
 */
export function MediaWell({
  src,
  alt,
  label,
  ratio = "3/2",
  priority = false,
  sizes,
  className,
  imageClassName,
}: {
  src?: string | null;
  alt?: string;
  /** Named in the empty state so the well still carries information. */
  label?: string;
  ratio?: "3/2" | "21/9" | "1/1";
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Extra classes on the photo itself — a parent `group` hover-zoom, say. */
  imageClassName?: string;
}) {
  const aspect =
    ratio === "21/9" ? "aspect-[21/9]" : ratio === "1/1" ? "aspect-square" : "aspect-[3/2]";

  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-linen", aspect, className)}>
        <Image
          src={src}
          alt={alt ?? label ?? ""}
          fill
          sizes={sizes ?? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
          priority={priority}
          className={cn("object-cover", imageClassName)}
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt ?? (label ? `${label} — render to follow` : "Render to follow")}
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-pine/8",
        aspect,
        className,
      )}
    >
      {/* Crop marks — the brand's signature framing device */}
      {["start-3 top-3", "end-3 top-3", "bottom-3 start-3", "bottom-3 end-3"].map((pos) => (
        <svg
          key={pos}
          aria-hidden
          viewBox="0 0 12 12"
          className={cn("absolute h-2.5 w-2.5 text-pine", pos)}
        >
          <path d="M6 0v12M0 6h12" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      ))}

      <div className="flex flex-col items-center gap-2 px-6 text-center">
        <span
          aria-hidden
          className="font-display text-display-l font-light leading-none text-pine/70"
        >
          Á
        </span>
        {label ? (
          <span className="type-micro uppercase tracking-eyebrow text-iron/80">{label}</span>
        ) : null}
      </div>
    </div>
  );
}
