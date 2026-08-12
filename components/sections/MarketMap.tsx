import { MARKETS } from "@/lib/content";

/**
 * The markets, as a map.
 *
 * Drawn as inline SVG rather than pulled from a tile provider: it needs no
 * token, no network request and no third-party script, it renders identically
 * in both themes, and a stylised outline reads better against the brand than
 * a photographic basemap would. The equirectangular projection is exact
 * enough at this size — pins land on their cities, which is all it has to do.
 */

const WIDTH = 1000;
const HEIGHT = 480;

/** Equirectangular: longitude maps linearly, latitude is flattened to match. */
const project = (lat: number, lng: number) => ({
  x: ((lng + 180) / 360) * WIDTH,
  y: ((90 - lat) / 180) * HEIGHT,
});

/**
 * Landmass outlines, heavily simplified — enough silhouette to orient the eye
 * around the markets we actually work in, which run from the Americas to
 * south-east Asia. Coordinates are lng/lat pairs.
 */
const LANDMASSES: Array<Array<[number, number]>> = [
  // Separate shapes rather than one connected ring: joining Europe to Asia to
  // Africa filled the Mediterranean and the Gulf, which is where half our
  // markets are.
  // North America
  [
    [-168, 66], [-156, 71], [-130, 70], [-100, 73], [-80, 72], [-64, 60],
    [-56, 51], [-66, 45], [-70, 41], [-76, 35], [-80, 26], [-90, 29],
    [-97, 26], [-105, 22], [-110, 24], [-117, 32], [-124, 40], [-125, 49],
    [-133, 55], [-150, 59], [-165, 62], [-168, 66],
  ],
  // South America
  [
    [-78, 8], [-70, 12], [-60, 10], [-51, 4], [-44, -2], [-35, -6], [-39, -14],
    [-48, -25], [-53, -34], [-62, -41], [-68, -50], [-74, -53], [-73, -44],
    [-71, -30], [-70, -18], [-75, -14], [-81, -5], [-79, 2], [-78, 8],
  ],
  // Africa
  [
    [-17, 21], [-16, 14], [-11, 5], [-2, 5], [6, 4], [9, 4], [9, -1],
    [12, -6], [12, -17], [15, -23], [18, -29], [20, -35], [27, -34],
    [32, -26], [35, -22], [40, -16], [40, -3], [42, 1], [44, 5], [51, 12],
    [43, 12], [40, 15], [37, 22], [34, 28], [32, 31], [25, 32], [17, 31],
    [10, 34], [0, 36], [-6, 36], [-10, 31], [-13, 27], [-17, 21],
  ],
  // Europe
  [
    [-9, 44], [-9, 39], [-6, 36], [0, 39], [4, 43], [8, 44], [12, 45],
    [16, 42], [20, 40], [24, 40], [28, 41], [30, 45], [38, 46], [40, 52],
    [32, 55], [30, 60], [25, 66], [21, 70], [15, 68], [10, 64], [5, 61],
    [8, 57], [4, 52], [-2, 49], [-5, 48], [-9, 44],
  ],
  // Asia
  [
    [40, 52], [50, 55], [60, 57], [70, 60], [80, 62], [95, 62], [110, 60],
    [125, 55], [135, 55], [143, 60], [150, 60], [155, 57], [143, 48],
    [135, 43], [128, 38], [122, 32], [121, 25], [110, 21], [108, 12],
    [104, 8], [100, 6], [98, 12], [95, 18], [92, 22], [89, 22], [85, 20],
    [80, 12], [77, 8], [73, 16], [70, 22], [64, 25], [58, 24], [52, 25],
    [50, 29], [48, 34], [44, 38], [40, 43], [40, 52],
  ],
  // Australia
  [
    [113, -22], [114, -35], [122, -34], [129, -32], [138, -35], [147, -38],
    [151, -34], [153, -28], [148, -20], [143, -13], [136, -12], [130, -12],
    [125, -14], [118, -20], [113, -22],
  ],
];

/**
 * Pins sit close together around the Gulf, so labels are placed by hand:
 * "above" clears the pin, "below" drops under it, and the side anchors push a
 * crowded label clear of its neighbour rather than letting the two collide.
 */
const LABEL: Record<string, { dy: number; anchor: "middle" | "start" | "end" }> = {
  uae: { dy: 26, anchor: "end" },
  oman: { dy: -14, anchor: "start" },
  georgia: { dy: -14, anchor: "middle" },
  egypt: { dy: -14, anchor: "end" },
  thailand: { dy: 34, anchor: "middle" },
  indonesia: { dy: 30, anchor: "middle" },
  usa: { dy: -14, anchor: "middle" },
};

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
    <section className="border-t border-rule bg-pine/8">
      <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
        <div className="flex flex-col gap-3">
          <h2 className="type-display-m max-w-3xl text-iron">{title}</h2>
          <p className="type-body-l max-w-2xl text-iron/80">{support}</p>
        </div>

        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="h-auto w-full min-w-[40rem]"
            role="img"
            aria-label={`World map showing Alcázar markets: ${MARKETS.map((m) => m.name).join(", ")}.`}
          >
            {LANDMASSES.map((shape, i) => (
              <polygon
                key={i}
                points={shape.map(([lng, lat]) => {
                  const { x, y } = project(lat, lng);
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                }).join(" ")}
                className="fill-ash/60 stroke-pine/40"
                strokeWidth={1}
              />
            ))}

            {MARKETS.map((m) => {
              const { x, y } = project(m.lat, m.lng);
              return (
                <g key={m.key}>
                  {/* A halo on live markets, so the eye finds them first. */}
                  {m.live ? (
                    <circle cx={x} cy={y} r={16} className="fill-pine/25" />
                  ) : null}
                  <circle cx={x} cy={y} r={6} className="fill-pine" />
                  <circle cx={x} cy={y} r={2.5} className="fill-frost" />
                  <text
                    x={x + (LABEL[m.key].anchor === "start" ? 12 : LABEL[m.key].anchor === "end" ? -12 : 0)}
                    y={y + LABEL[m.key].dy}
                    textAnchor={LABEL[m.key].anchor}
                    className="fill-iron"
                    style={{ fontSize: 18, fontWeight: 500 }}
                  >
                    {m.name === "United Arab Emirates" ? "UAE" : m.name}
                    <tspan className="fill-iron/70" style={{ fontSize: 15 }}>
                      {"  "}
                      {m.returnLow}–{m.returnHigh}%
                    </tspan>
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* The same markets as a list, because the map is a picture and a
            screen reader should not have to parse one. */}
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
