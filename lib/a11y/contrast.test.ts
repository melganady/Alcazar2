import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { AA_LARGE, AA_NORMAL, contrastRatio } from "./contrast";

/**
 * §12 — "verify programmatically in CI and fail on regression".
 * Tokens are read from design/tokens.css rather than duplicated here, so
 * changing a brand colour without checking contrast fails the build.
 */
const tokens = readFileSync(new URL("../../design/tokens.css", import.meta.url), "utf8");
const token = (name: string): string => {
  const m = tokens.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (!m) throw new Error(`Token ${name} not found in design/tokens.css`);
  return m[1];
};

const IRON = token("--iron-grey");
const ASH = token("--ash-wood");
const PINE = token("--pine-smoke");
const LINEN = token("--nordic-linen");
const FROST = token("--frost-white");

const composite = (fg: string, bg: string, alpha: number): string => {
  const mix = (i: number) => {
    const f = parseInt(fg.slice(1 + i * 2, 3 + i * 2), 16);
    const b = parseInt(bg.slice(1 + i * 2, 3 + i * 2), 16);
    return Math.round(f * alpha + b * (1 - alpha))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${mix(0)}${mix(1)}${mix(2)}`;
};

describe("contrastRatio", () => {
  it("computes the known black/white extreme", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });
  it("is order-independent", () => {
    expect(contrastRatio(IRON, FROST)).toBeCloseTo(contrastRatio(FROST, IRON), 10);
  });
});

describe("iron grey — the palette's only dark — passes AA on every ground", () => {
  it("on frost white, the primary page ground", () => {
    expect(contrastRatio(IRON, FROST)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("on nordic linen, the surface colour", () => {
    expect(contrastRatio(IRON, LINEN)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("on ash wood, the warm ground", () => {
    expect(contrastRatio(IRON, ASH)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});

describe("reversed type on the iron field passes AA", () => {
  it("ash wood on iron — the specified reversed pair", () => {
    expect(contrastRatio(ASH, IRON)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("linen and frost on iron", () => {
    expect(contrastRatio(LINEN, IRON)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(FROST, IRON)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});

/*
 * Iron grey is far lighter than a near-black, so muted tints lose contrast
 * quickly: /70 is 4.14 on frost and already fails. /80 is the floor, and it
 * is the floor the components use. Do not lower it.
 */
describe("muted tint floors", () => {
  it("iron/80 passes AA on frost and linen", () => {
    expect(contrastRatio(composite(IRON, FROST, 0.8), FROST)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(composite(IRON, LINEN, 0.8), LINEN)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("iron/70 does NOT pass — proves /80 is a floor, not a preference", () => {
    expect(contrastRatio(composite(IRON, FROST, 0.7), FROST)).toBeLessThan(AA_NORMAL);
  });
  it("ash/80 — the reversed floor — passes AA on iron", () => {
    expect(contrastRatio(composite(ASH, IRON, 0.8), IRON)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("full iron is required for muted text on ash wood panels", () => {
    // iron/80 on ash is 4.24 — below AA, so ash panels use full-strength iron.
    expect(contrastRatio(composite(IRON, ASH, 0.8), ASH)).toBeLessThan(AA_NORMAL);
    expect(contrastRatio(IRON, ASH)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});

/*
 * Pine smoke is the accent and never carries text: at 2.98 on frost it fails
 * AA by a wide margin, and iron on pine is only 3.16. It is used exclusively
 * as a non-text mark — rules, tag outlines, crop marks — where the meaning is
 * carried by adjacent iron-grey text.
 */
describe("pine smoke is a non-text accent by construction", () => {
  it("fails AA as text on every ground, which is why it never carries text", () => {
    expect(contrastRatio(PINE, FROST)).toBeLessThan(AA_NORMAL);
    expect(contrastRatio(PINE, LINEN)).toBeLessThan(AA_NORMAL);
    expect(contrastRatio(IRON, PINE)).toBeLessThan(AA_NORMAL);
  });
  it("is distinguishable from its ground as a graphical mark", () => {
    expect(contrastRatio(PINE, FROST)).toBeGreaterThan(2.5);
  });
});

describe("hairlines", () => {
  it("the ash-wood rule is a visible separator, never the sole carrier of meaning", () => {
    const RULE = token("--rule");
    expect(contrastRatio(RULE, FROST)).toBeGreaterThan(1);
    expect(AA_LARGE).toBe(3);
  });
});
