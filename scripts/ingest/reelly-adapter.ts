/**
 * TRACK B — Reelly licensed feed adapter (§5).
 *
 * The route the brief always pointed at for volume: a contractual feed that
 * carries the right to display, which is precisely what a scrape does not.
 *
 * Contract (verified against the live API, Aug 2026):
 *   base   https://api-reelly.up.railway.app/api/v2/clients
 *   auth   X-API-Key header
 *   list   GET /projects?limit=&offset=  -> { count, next, previous, results }
 *   detail GET /projects/{id}            -> the full card: media galleries,
 *                                           payment plan steps, typical units,
 *                                           escrow number, service charge
 *
 * The list endpoint returns summaries carrying only a cover image, so the
 * import fetches the detail record per project for galleries and payment plans.
 *
 * Usage:
 *   npm run reelly:discover
 *   npm run reelly:import -- --limit=50 --contract-ref="…" --with-media
 *
 * A Reelly licence grants the right to use the data and imagery. It is not a
 * Trakheesi permit. Everything lands as a DRAFT and the publish gate still
 * requires a permit number tied to our own licence.
 */
import { getPayload } from "payload";
import config from "../../payload.config";

const BASE = process.env.REELLY_API_BASE ?? "https://api-reelly.up.railway.app/api/v2/clients";
const KEY = process.env.REELLY_API_KEY;

type Envelope<T> = { count: number; next: string | null; previous: string | null; results: T[] };
type Media = { url?: string; metadata?: { mime?: string; width?: number; height?: number } };
export type ReellyProject = Record<string, unknown>;

async function api<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  if (!KEY) {
    throw new Error(
      "REELLY_API_KEY is not set. Add it to .env (gitignored):\n  REELLY_API_KEY=your-key-here",
    );
  }
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { "X-API-Key": KEY, Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Reelly ${res.status} on ${path}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

/* ---------------------------------------------------------------- discovery */

export async function discover() {
  const page = await api<Envelope<ReellyProject>>("/projects", { limit: 1, offset: 0 });
  console.log(`\nProjects available on this key: ${page.count}\n`);
  const sample = page.results[0];
  if (!sample) {
    console.log("No results — check the key's entitlements with Reelly.");
    return;
  }
  const describe = (obj: ReellyProject, prefix = ""): void => {
    for (const [k, v] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (Array.isArray(v)) {
        console.log(`  ${path.padEnd(36)} array[${v.length}]`);
        if (v[0] && typeof v[0] === "object" && prefix.split(".").length < 2) {
          describe(v[0] as ReellyProject, `${path}[]`);
        }
      } else if (v && typeof v === "object") {
        console.log(`  ${path.padEnd(36)} object`);
        if (prefix.split(".").length < 2) describe(v as ReellyProject, path);
      } else {
        console.log(`  ${path.padEnd(36)} ${typeof v} = ${String(v).slice(0, 44)}`);
      }
    }
  };
  describe(sample);
}

/* ------------------------------------------------------------------ mapping */

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;

const int = (v: unknown): number | undefined => {
  const n =
    typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(/[^\d.]/g, "")) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
};

const at = (o: ReellyProject, path: string): unknown =>
  path.split(".").reduce<unknown>(
    (acc, part) =>
      acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined,
    o,
  );

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);

/** "Q2 2026" -> { quarter: "Q2", year: 2026 } */
export function parseCompletion(v: unknown): {
  quarter?: "Q1" | "Q2" | "Q3" | "Q4";
  year?: number;
} {
  const s = str(v);
  if (!s) return {};
  const m = s.match(/\b(Q[1-4])\s*(20\d{2})\b/i);
  if (m) return { quarter: m[1].toUpperCase() as "Q1", year: Number(m[2]) };
  const y = s.match(/\b(20\d{2})\b/);
  return y ? { year: Number(y[1]) } : {};
}

/** "26 AED/sqft" -> 26 */
export function parseServiceCharge(v: unknown): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const m = s.match(/([\d.]+)/);
  return m ? Number(m[1]) : undefined;
}

const OUR_TYPES = [
  "Apartment", "Penthouse", "Townhouse", "Villa", "Sky Villa",
  "Duplex", "Mansion", "Hotel Room", "Office",
] as const;

export function mapPropertyTypes(display: unknown): string[] {
  const items = Array.isArray(display) ? display.map((d) => String(d)) : [];
  const mapped = items
    .map((d) => OUR_TYPES.find((t) => t.toLowerCase() === d.toLowerCase().trim()))
    .filter((t): t is (typeof OUR_TYPES)[number] => Boolean(t));
  return mapped.length > 0 ? [...new Set(mapped)] : ["Apartment"];
}

/** Reelly keeps renders in separate buckets plus a cover and a master plan. */
export function extractMedia(p: ReellyProject): string[] {
  const urls: string[] = [];
  const push = (v: unknown) => {
    if (!v) return;
    for (const item of Array.isArray(v) ? v : [v]) {
      if (typeof item === "string") urls.push(item);
      else if (item && typeof item === "object") {
        const u = (item as Media).url;
        if (typeof u === "string") urls.push(u);
      }
    }
  };
  // Cover first so it becomes the hero, then galleries in reading order.
  push(p.cover_image);
  push(p.architecture);
  push(p.interior);
  push(p.lobby);
  push(p.general_plan);
  return [...new Set(urls)].filter((u) => /^https?:\/\//.test(u));
}

/** payment_plans[].steps[] -> our milestone rows, with the split derived. */
export function mapPaymentPlan(p: ReellyProject) {
  const plans = Array.isArray(p.payment_plans) ? (p.payment_plans as ReellyProject[]) : [];
  const plan = plans[0];
  const steps = plan && Array.isArray(plan.steps) ? (plan.steps as ReellyProject[]) : [];

  const milestones = steps
    .map((s) => ({
      label: str(s.name) ?? "Instalment",
      pct: int(s.percentage) ?? 0,
      trigger: str(s.name) ?? "—",
    }))
    .filter((m) => m.pct > 0);

  const isHandover = (m: { label: string }) => /handover|completion/i.test(m.label);
  const onHandoverPct = milestones.filter(isHandover).reduce((s, m) => s + m.pct, 0);
  const duringConstructionPct = milestones
    .filter((m) => !isHandover(m))
    .reduce((s, m) => s + m.pct, 0);
  const postHandover = p.post_handover === true;

  const label =
    duringConstructionPct && onHandoverPct
      ? `${duringConstructionPct}/${onHandoverPct}${postHandover ? " post-handover" : ""}`
      : (str(plan ? plan.name : undefined) ?? "");

  return {
    label,
    duringConstructionPct: duringConstructionPct || undefined,
    onHandoverPct: onHandoverPct || undefined,
    milestones,
  };
}

/** typical_units[] -> our UnitType rows. */
export function mapUnitTypes(p: ReellyProject) {
  const units = Array.isArray(p.typical_units) ? (p.typical_units as ReellyProject[]) : [];
  return units.map((u) => {
    const beds = int(u.bedrooms) ?? 0;
    return {
      label: beds === 0 ? "Studio" : `${beds} BR`,
      bedrooms: beds,
      sizeSqftMin: int(u.from_size_sqft),
      sizeSqftMax: int(u.to_size_sqft),
      priceFromAED: int(u.from_price_aed),
      availability: "available" as const,
    };
  });
}

const EMIRATES = ["Dubai", "Abu Dhabi", "Ras Al Khaimah", "Sharjah", "Ajman", "UAQ", "Fujairah"];

export function toProjectDraft(p: ReellyProject, contractRef: string) {
  const name = str(p.name);
  if (!name) return null;

  const district = str(at(p, "location.district"));
  const sector = str(at(p, "location.sector"));
  const region = str(at(p, "location.region")) ?? "Dubai";
  const subCommunity = sector ?? district ?? name;
  const emirate = EMIRATES.find((e) => region.toLowerCase().includes(e.toLowerCase())) ?? "Dubai";

  const { quarter, year } = parseCompletion(p.completion_date);
  const status =
    p.sale_status === "sold_out"
      ? "sold-out"
      : p.construction_status === "completed"
        ? "handed-over"
        : p.construction_status === "under_construction"
          ? "under-construction"
          : "launched";

  return {
    slug: `${slugify(str(p.slug_name) ?? name)}-${slugify(subCommunity)}`.slice(0, 100),
    name,
    subCommunity,
    emirate: emirate as "Dubai",
    status: status as "launched",
    propertyTypes: mapPropertyTypes(p.available_unit_types_display) as "Apartment"[],
    bedroomsMin: int(p.min_bedrooms) ?? 0,
    bedroomsMax: int(p.max_bedrooms) ?? int(p.min_bedrooms) ?? 1,
    priceFromAED: int(p.min_price) ?? 0,
    priceToAED: int(p.max_price),
    sizeFromSqft: int(p.min_size) ?? 0,
    sizeToSqft: int(p.max_size),
    paymentPlan: mapPaymentPlan(p),
    handoverQuarter: quarter,
    handoverYear: year,
    serviceChargeEstimateAEDPerSqft: parseServiceCharge(p.service_charge),
    // §11.4 — escrow is a compliance statement rendered on every project page.
    escrowAccountConfirmed: Boolean(str(p.escrow_number)),
    dldProjectNumber: str(p.escrow_number),
    unitTypes: mapUnitTypes(p),
    developerName: str(p.developer),
    mediaLicence: "developer-supplied" as const,
    mediaLicenceNote: `Licensed feed: Reelly, contract ${contractRef}`,
    alcazarStatus: "monitoring" as const,
    isFixture: false,
    // publishedAt deliberately absent — the Trakheesi gate still applies.
  };
}

/* ------------------------------------------------------------------- import */

async function importProjects() {
  const args = process.argv.slice(2);
  const get = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=");
  const limit = Number(get("limit") ?? 20);
  const contractRef = get("contract-ref");
  const withMedia = args.includes("--with-media");
  const maxImages = Number(get("max-images") ?? 10);

  if (!contractRef) {
    console.error(
      'Refusing to import without --contract-ref="…".\n' +
        "§11.9 requires the licence recorded on every project so the right to display\n" +
        "each image is auditable. Use your Reelly contract or subscription reference.",
    );
    process.exit(1);
  }

  const payload = await getPayload({ config });
  const listing = await api<Envelope<ReellyProject>>("/projects", { limit, offset: 0 });
  console.log(`\n${listing.count} projects on this key; importing up to ${limit}.\n`);

  let created = 0;
  let skipped = 0;
  let mediaCount = 0;
  const failures: string[] = [];

  for (const summary of listing.results) {
    const id = summary.id;
    let full: ReellyProject = summary;
    try {
      full = await api<ReellyProject>(`/projects/${id}`);
    } catch {
      failures.push(`detail fetch failed for id ${id} — imported from the summary only`);
    }

    const draft = toProjectDraft(full, contractRef);
    if (!draft) {
      failures.push(`id ${id}: no name`);
      continue;
    }

    const exists = await payload.find({
      collection: "projects",
      where: { slug: { equals: draft.slug } },
      limit: 1,
    });
    if (exists.docs[0]) {
      skipped++;
      continue;
    }

    let developerId: number | undefined;
    if (draft.developerName) {
      const d = await payload.find({
        collection: "developers",
        where: { name: { equals: draft.developerName } },
        limit: 1,
      });
      developerId =
        d.docs[0]?.id ??
        (
          await payload.create({
            collection: "developers",
            data: {
              slug: slugify(draft.developerName),
              name: draft.developerName,
              alcazarPanelStatus: "selective",
            },
          })
        ).id;
    }

    const projectData: Record<string, unknown> = { ...draft };
    delete projectData.developerName;
    projectData.developer = developerId;

    const project = await payload.create({
      collection: "projects",
      data: projectData as Parameters<typeof payload.create>[0]["data"],
    });
    created++;

    let imported = 0;
    if (withMedia) {
      const urls = extractMedia(full).slice(0, maxImages);
      const ids: number[] = [];
      for (const [i, url] of urls.entries()) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const buf = Buffer.from(await res.arrayBuffer());
          const mime = res.headers.get("content-type") ?? "image/jpeg";
          const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
          const doc = await payload.create({
            collection: "media",
            data: {
              alt: `${draft.name}, ${draft.subCommunity} — render ${i + 1}`,
              credit: `Licensed via Reelly · contract ${contractRef}`,
            },
            file: {
              data: buf,
              name: `${draft.slug}-${String(i + 1).padStart(3, "0")}.${ext}`,
              mimetype: mime,
              size: buf.byteLength,
            },
          });
          ids.push(doc.id);
          mediaCount++;
          imported++;
        } catch {
          /* one bad asset never fails the run */
        }
      }
      if (ids.length > 0) {
        await payload.update({
          collection: "projects",
          id: project.id,
          data: { media: { hero: ids[0], gallery: ids.slice(1) } },
        });
      }
    }

    console.log(
      `  ${draft.slug}  ${draft.paymentPlan.label || "—"} · ${draft.handoverQuarter ?? "?"} ${draft.handoverYear ?? "?"}${withMedia ? ` · ${imported} images` : ""}`,
    );
  }

  console.log(
    `\n${created} drafts created, ${skipped} already present, ${mediaCount} images imported.`,
  );
  if (failures.length) {
    console.log(`\n${failures.length} records had problems:`);
    for (const f of failures.slice(0, 10)) console.log(`   ${f}`);
  }
  console.log(
    "\nAll drafts. A data licence is not an advertising permit — each still needs a\n" +
      "Trakheesi number and an Alcázar verdict. Run `npm run validate:projects`.\n",
  );
  process.exit(0);
}

if (process.argv[1]?.includes("reelly-adapter")) {
  const mode = process.argv.includes("--discover") ? discover : importProjects;
  mode().catch((err) => {
    console.error(`\n${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
