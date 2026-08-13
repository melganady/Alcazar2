import { MARKETS } from "@/lib/content";
import { WorldMap } from "./WorldMap";

/**
 * The markets section — the full map, labelled, plus the same markets again
 * as a list so a screen reader isn't left to parse an SVG to learn where we
 * operate.
 */
export function MarketMap({
  title,
  support,
  note,
}: {
  title: string;
  support: string;
  note: string;
}) {
  return (
    <section className="border-t border-rule bg-linen">
      <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6 md:py-20">
        <div className="flex flex-col gap-3">
          <h2 className="type-display-m max-w-3xl text-iron">{title}</h2>
          <p className="type-body-l max-w-2xl text-iron/80">{support}</p>
        </div>

        <div className="overflow-x-auto">
          <WorldMap className="h-auto w-full min-w-[52rem]" />
        </div>

        {/* The same markets as a list: a map is a picture, and a screen reader
            should not have to parse one to learn where we operate. */}
        <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {MARKETS.map((m) => (
            <li key={m.key} className="flex flex-col gap-1 border-t-2 border-pine pt-3">
              <span className="type-display-s flex items-center gap-2 text-iron">
                <span aria-hidden className="text-[1.4em] leading-none">
                  {m.flag}
                </span>
                {m.name}
              </span>
              <span className="type-body-s text-iron/80">{m.note}</span>
              <span className="type-body-s text-iron">
                {m.returnLow}–{m.returnHigh}%{" "}
                <span className="type-micro text-iron/80">{m.basis}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* The basis matters more than the headline number: a rental yield and
            a return on a completed flip are not the same measure. */}
        <p className="type-micro max-w-3xl border-t border-pine/40 pt-5 text-iron/80">{note}</p>
      </div>
    </section>
  );
}
