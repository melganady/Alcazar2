/**
 * §12 — "JS on the projects index < 180KB gzipped. Fail the build if exceeded."
 *
 * Sums the gzipped size of every unique JS chunk a route loads on first paint,
 * which is what Next reports as "First Load JS". LCP/CLS/INP are field metrics
 * and belong to Lighthouse CI against a running preview; this guard covers the
 * one budget that is deterministic at build time.
 *
 *   npm run build && npm run check:budgets
 */
import { existsSync, readFileSync } from "fs";
import { gzipSync } from "zlib";
import { join } from "path";

const BUDGET_KB = 180;

/** Routes that carry the performance risk. Missing routes fail loudly, not silently. */
const ROUTES = [
  "/[locale]/page",
  "/[locale]/projects/page",
  "/[locale]/projects/[slug]/page",
];

type AppBuildManifest = { pages: Record<string, string[]> };

const root = process.cwd();
const manifestPath = join(root, ".next", "app-build-manifest.json");

if (!existsSync(manifestPath)) {
  console.error("No .next/app-build-manifest.json — run `npm run build` first.");
  process.exit(1);
}

// A dev server writes its own (unminified) chunks into .next and would make
// this check meaningless. Refuse rather than report a wrong number.
if (existsSync(join(root, ".next", "static", "development"))) {
  console.error(
    "`.next` contains dev-server output. Stop the dev server, run `npm run build`, then re-check.",
  );
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as AppBuildManifest;

const gzipCache = new Map<string, number>();
const gzippedSize = (file: string): number => {
  if (gzipCache.has(file)) return gzipCache.get(file)!;
  const p = join(root, ".next", file);
  const size = existsSync(p) ? gzipSync(readFileSync(p)).byteLength : 0;
  gzipCache.set(file, size);
  return size;
};

let failed = false;

for (const route of ROUTES) {
  const files = manifest.pages[route];
  if (!files) {
    console.error(`  FAIL  ${route} — not present in the build manifest`);
    failed = true;
    continue;
  }
  const unique = [...new Set(files.filter((f) => f.endsWith(".js")))];
  const kb = unique.reduce((sum, f) => sum + gzippedSize(f), 0) / 1024;
  const ok = kb <= BUDGET_KB;
  if (!ok) failed = true;
  console.log(
    `  ${ok ? "PASS" : "FAIL"}  ${route.replace("/page", "").padEnd(32)} ${kb.toFixed(1)} KB gzipped / ${BUDGET_KB} KB`,
  );
}

if (failed) {
  console.error("\nJS budget exceeded (§12). Lazy-load the offending import or split the route.");
  process.exit(1);
}
console.log("\nAll route JS budgets within §12 limits.");
