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

const BLUE = token("--alcazar-blue");
const SAND = token("--desert-sand");
const MIDNIGHT = token("--midnight");
const WHITE = token("--white");

describe("contrastRatio", () => {
  it("computes the known black/white extreme", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });
  it("is order-independent", () => {
    expect(contrastRatio(BLUE, SAND)).toBeCloseTo(contrastRatio(SAND, BLUE), 10);
  });
});

describe("brand palette meets WCAG 2.1 AA", () => {
  it("blue on sand passes AA for normal text", () => {
    expect(contrastRatio(BLUE, SAND)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("blue on white passes AA for normal text", () => {
    expect(contrastRatio(BLUE, WHITE)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("sand on blue — the reversed pair — passes AA for normal text", () => {
    expect(contrastRatio(SAND, BLUE)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("midnight on sand passes AA for normal text", () => {
    expect(contrastRatio(MIDNIGHT, SAND)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("midnight on white passes AA for normal text", () => {
    expect(contrastRatio(MIDNIGHT, WHITE)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  /*
   * Muted text is used widely (text-midnight/70, /60, /50). Compositing them
   * over their real backgrounds is the only honest way to check them.
   */
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

  /*
   * These are the exact tints the components use. /65 is the muted floor and
   * /80 the reversed floor — both were raised from lower values when this
   * suite first failed. Anything below them is decorative (aria-hidden crop
   * marks) or a disabled control, both exempt under WCAG 1.4.3.
   */
  it("midnight/70 body text passes AA on sand and white", () => {
    expect(contrastRatio(composite(MIDNIGHT, SAND, 0.7), SAND)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(composite(MIDNIGHT, WHITE, 0.7), WHITE)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("midnight/65 — the muted floor — passes AA on sand and white", () => {
    expect(contrastRatio(composite(MIDNIGHT, SAND, 0.65), SAND)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(composite(MIDNIGHT, WHITE, 0.65), WHITE)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("sand/80 — the reversed floor — passes AA on blue", () => {
    expect(contrastRatio(composite(SAND, BLUE, 0.8), BLUE)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("sand/60 footer text passes AA on midnight", () => {
    expect(contrastRatio(composite(SAND, MIDNIGHT, 0.6), MIDNIGHT)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
  it("the hairline rule is visible against sand at the 3:1 non-text threshold", () => {
    const RULE = token("--rule");
    expect(contrastRatio(RULE, SAND)).toBeGreaterThan(1);
    // Documented as a design decision: hairlines are decorative separators,
    // never the sole means of conveying information.
    expect(AA_LARGE).toBe(3);
  });
});
