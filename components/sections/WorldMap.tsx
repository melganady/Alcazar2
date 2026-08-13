import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import type { Topology } from "topojson-specification";
import worldAtlas from "world-atlas/countries-110m.json";
import { MARKETS } from "@/lib/content";

/**
 * The world map, as pure SVG — split out of MarketMap so the same drawing
 * can sit full-width with labels on the markets section, or small and quiet
 * beside the hero copy with just the dots.
 *
 * Coastlines come from Natural Earth via world-atlas (public domain), not
 * hand-drawn polygons — an approximated Africa reads as a mistake anywhere
 * this appears. Projected to SVG paths on the server: no tile provider, no
 * API key, no client-side mapping library.
 */

const WIDTH = 1100;
const HEIGHT = 470;

/** ISO 3166-1 numeric, which is how Natural Earth identifies a country. */
const MARKET_ISO: Record<string, string> = {
  uae: "784",
  oman: "512",
  georgia: "268",
  thailand: "764",
  indonesia: "360",
  egypt: "818",
  usa: "840",
};
const MARKET_IDS = new Set(Object.values(MARKET_ISO));

/**
 * Label placement. The Gulf markets sit within a few degrees of each other, so
 * these are positioned by hand rather than left to collide.
 */
const LABEL: Record<string, { dx: number; dy: number; anchor: "middle" | "start" | "end" }> = {
  usa: { dx: 0, dy: -20, anchor: "middle" },
  georgia: { dx: 0, dy: -18, anchor: "middle" },
  egypt: { dx: -14, dy: 2, anchor: "end" },
  uae: { dx: 14, dy: -10, anchor: "start" },
  oman: { dx: 14, dy: 18, anchor: "start" },
  thailand: { dx: 10, dy: -14, anchor: "start" },
  indonesia: { dx: 0, dy: 30, anchor: "middle" },
};

const world = worldAtlas as unknown as Topology;
const all = feature(
  world,
  world.objects.countries,
) as unknown as FeatureCollection<Geometry, { name?: string }>;

/**
 * Antarctica out. No market is anywhere near it, and at this projection it
 * spans the full width along the bottom — a quarter of the frame spent on the
 * one continent the page has nothing to say about. Dropping it lets the fit
 * scale everything else up.
 */
const countries: FeatureCollection<Geometry, { name?: string }> = {
  ...all,
  features: all.features.filter((f) => String(f.id) !== "010"),
};

const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], countries);
const toPath = geoPath(projection);

export function WorldMap({
  showLabels = true,
  className,
  /** Faint land, faint dots — for sitting behind text rather than beside it. */
  tone = "default",
  /** "slice" crops to fill its box (a background); "meet" (default) fits whole. */
  preserveAspectRatio,
}: {
  /** Off for the compact hero panel — return figures crowd at small sizes. */
  showLabels?: boolean;
  className?: string;
  tone?: "default" | "muted";
  preserveAspectRatio?: "xMidYMid slice" | "xMidYMid meet";
}) {
  const muted = tone === "muted";
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio={preserveAspectRatio}
      className={className ?? "h-auto w-full"}
      role="img"
      aria-label={`World map marking the countries Alcázar operates in: ${MARKETS.map((m) => m.name).join(", ")}.`}
    >
      {/* Every country, quietly. The markets are then lifted out of it. */}
      <g>
        {countries.features.map((f) => {
          const d = toPath(f);
          if (!d) return null;
          const isMarket = MARKET_IDS.has(String(f.id));
          return (
            <path
              key={String(f.id)}
              d={d}
              className={
                muted
                  ? isMarket
                    ? "fill-pine/25 stroke-frost"
                    : "fill-ash/25 stroke-frost"
                  : isMarket
                    ? "fill-pine stroke-linen"
                    : "fill-ash/70 stroke-linen"
              }
              strokeWidth={0.5}
            />
          );
        })}
      </g>

      {MARKETS.map((m) => {
        const point = projection([m.lng, m.lat]);
        if (!point) return null;
        const [x, y] = point;
        const label = LABEL[m.key];
        return (
          <g key={m.key}>
            {/* A ring on live markets, so the eye lands there first. */}
            {m.live ? (
              <circle
                cx={x}
                cy={y}
                r={13}
                className={muted ? "fill-none stroke-iron/35" : "fill-none stroke-iron"}
                strokeWidth={1.5}
              />
            ) : null}
            <circle cx={x} cy={y} r={4.5} className={muted ? "fill-iron/45" : "fill-iron"} />
            <circle cx={x} cy={y} r={1.75} className="fill-frost" />
            {showLabels ? (
              <text
                x={x + label.dx}
                y={y + label.dy}
                textAnchor={label.anchor}
                className="fill-iron"
                style={{ fontSize: 16, fontWeight: 500, letterSpacing: "0.02em" }}
              >
                {m.name === "United Arab Emirates" ? "UAE" : m.name}
                <tspan className="fill-iron/70" style={{ fontSize: 14, fontWeight: 400 }}>
                  {"  "}
                  {m.returnLow}–{m.returnHigh}%
                </tspan>
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
