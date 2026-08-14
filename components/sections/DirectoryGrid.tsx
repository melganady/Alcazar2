import { Link } from "@/i18n/navigation";
import { MediaWell } from "@/components/primitives/MediaWell";
import type { DirectoryEntry } from "@/lib/directory";

/**
 * Shared card grid for the developer and community directories, so both read
 * as one system rather than two near-identical pages that drift apart.
 */
export function DirectoryGrid({
  entries,
  basePath,
  countLabel,
}: {
  entries: DirectoryEntry[];
  basePath: "/developers" | "/communities";
  countLabel: (n: number) => string;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((e) => (
        <article
          key={e.slug}
          className="group border border-rule bg-surface transition-colors duration-fast ease-brand hover:border-steel"
        >
          <Link href={`${basePath}/${e.slug}`} className="block">
            <MediaWell
              src={e.image}
              alt={e.imageAlt ?? e.name}
              label={e.name}
              ratio="3/2"
              imageClassName="transition-transform duration-slow ease-brand group-hover:scale-105"
            />
          </Link>
          <div className="flex flex-col gap-2 p-5">
            <h2 className="type-display-s text-navy">
              <Link
                href={`${basePath}/${e.slug}`}
                className="underline-offset-4 group-hover:underline"
              >
                {e.name}
              </Link>
            </h2>
            {e.subtitle ? <p className="type-body-s text-navy/80">{e.subtitle}</p> : null}
            <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-rule pt-3">
              <span className="type-body-s text-navy">{countLabel(e.projectCount)}</span>
              {e.priceFromAED ? (
                <span className="type-body-s text-navy/80">
                  from AED {e.priceFromAED.toLocaleString("en-AE")}
                </span>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
