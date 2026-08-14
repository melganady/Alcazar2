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

const NAVY = token("--rein-navy");
const CHALK = token("--chalk");
const STEEL = token("--steel");
const SURFACE = token("--surface");
const PAPER = token("--paper");
const GRAPHITE = token("--graphite");
const STEEL_700 = token("--steel-700");

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
    expect(contrastRatio(NAVY, PAPER)).toBeCloseTo(contrastRatio(PAPER, NAVY), 10);
  });
});

describe("REIN navy — the signature — passes AA on every light ground", () => {
  it("on paper, the primary page ground", () => {
    expect(contrastRatio(NAVY, PAPER)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("on surface, the panel colour", () => {
    expect(contrastRatio(NAVY, SURFACE)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("on chalk, the near-white", () => {
    expect(contrastRatio(NAVY, CHALK)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});

describe("graphite — body copy at rest — passes AA on every light ground", () => {
  it("on paper and on surface", () => {
    expect(contrastRatio(GRAPHITE, PAPER)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(GRAPHITE, SURFACE)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});

describe("reversed type on the navy field passes AA", () => {
  it("chalk on navy — the specified reversed pair", () => {
    expect(contrastRatio(CHALK, NAVY)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("paper and surface on navy", () => {
    expect(contrastRatio(PAPER, NAVY)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(SURFACE, NAVY)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});

/*
 * Navy is a near-black, so it holds AA much further down the alpha scale than
 * the old mid-grey ink did: /60 is the first step that clears 4.5 on paper.
 * The components use /80, which sits at 10.15 with a wide margin. The floor is
 * pinned here so a future "soften the muted text" change has to prove itself.
 */
describe("muted tint floors", () => {
  it("navy/80 — the strength the components use — passes on paper and surface", () => {
    expect(contrastRatio(composite(NAVY, PAPER, 0.8), PAPER)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(composite(NAVY, SURFACE, 0.8), SURFACE)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("navy/60 still passes on paper; /50 does not — that is the real floor", () => {
    expect(contrastRatio(composite(NAVY, PAPER, 0.6), PAPER)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(composite(NAVY, PAPER, 0.5), PAPER)).toBeLessThan(AA_NORMAL);
  });
  it("chalk/70 — the reversed floor — passes AA on navy", () => {
    expect(contrastRatio(composite(CHALK, NAVY, 0.7), NAVY)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("graphite/70 passes on paper, /60 does not", () => {
    expect(contrastRatio(composite(GRAPHITE, PAPER, 0.7), PAPER)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(composite(GRAPHITE, PAPER, 0.6), PAPER)).toBeLessThan(AA_NORMAL);
  });
});

/*
 * Steel is the accent. At 3.71 on paper it clears AA for large text and
 * graphical objects but fails for body copy — exactly the rule the brand
 * states: base steel is tuned for chrome and large type, and paragraph text in
 * the accent steps down to steel-700 or deeper.
 */
describe("steel is a non-text accent at base strength", () => {
  it("fails AA as body text on the light grounds, which is why it never carries body copy", () => {
    expect(contrastRatio(STEEL, PAPER)).toBeLessThan(AA_NORMAL);
    expect(contrastRatio(STEEL, SURFACE)).toBeLessThan(AA_NORMAL);
  });
  it("still clears the large-text and graphical-object floor", () => {
    expect(contrastRatio(STEEL, PAPER)).toBeGreaterThanOrEqual(AA_LARGE);
  });
  it("steel-700 is the first step that carries paragraph text on paper", () => {
    expect(contrastRatio(STEEL_700, PAPER)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("clears AA-large reversed on the navy field, where it labels the fact strips", () => {
    expect(contrastRatio(STEEL, NAVY)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});

describe("hairlines", () => {
  it("the navy-tinted rule is a visible separator, never the sole carrier of meaning", () => {
    const RULE = token("--rule");
    expect(contrastRatio(RULE, PAPER)).toBeGreaterThan(1);
    expect(AA_LARGE).toBe(3);
  });
});

/*
 * Steel is used widely as a wash and as graphical marks. These pin the two
 * rules that keep that safe: text never sits IN base steel, and text sitting
 * ON a steel wash still clears AA — at full strength and at the /80 muted
 * strength the components use.
 */
describe("steel used as a wash stays accessible", () => {
  it("navy text on a steel wash clears AA at every strength we use", () => {
    for (const alpha of [0.08, 0.12, 0.18, 0.25]) {
      const wash = composite(STEEL, PAPER, alpha);
      expect(contrastRatio(NAVY, wash)).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(contrastRatio(composite(NAVY, wash, 0.8), wash)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });
  it("solid steel still fails as body text, which is why it is never used for it", () => {
    expect(contrastRatio(STEEL, PAPER)).toBeLessThan(AA_NORMAL);
  });
});

/*
 * Steel numerals ("01"–"08" beside the eight tests) sit at 3.71 and would fail
 * AA if they carried meaning. They do not: they duplicate DOM order, the
 * adjacent navy title is the content, and they are marked aria-hidden so the
 * decorative claim holds for assistive tech too. This test exists so that
 * reasoning is on the record rather than assumed.
 */
describe("steel numerals are decorative, not informational", () => {
  it("would fail AA as body text, which is why they are aria-hidden ordinals", () => {
    expect(contrastRatio(STEEL, PAPER)).toBeLessThan(AA_NORMAL);
  });
  it("their navy companion text passes comfortably", () => {
    expect(contrastRatio(NAVY, PAPER)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});
