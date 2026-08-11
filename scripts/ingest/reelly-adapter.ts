/**
 * TRACK B — Reelly licensed feed adapter (§5).
 *
 * This is the route the brief always pointed at for volume: a contractual feed
 * that comes with the right to display, which is precisely what separates it
 * from scraping. Implements the FeedAdapter interface from feed-adapter.ts.
 *
 * Contract (docs.reelly.ai, API v2.0):
 *   base   https://api-reelly.up.railway.app/api/v2/clients
 *   auth   X-API-Key header
 *   list   GET /projects?limit=&offset=      -> { count, next, previous, results }
 *   detail GET /projects/{id}
 *   media  { url, metadata: { mime, size, width, height } }
 *
 * Usage:
 *   npm run reelly:discover                 # print the real field names, map nothing
 *   npm run reelly:import -- --limit=20 --contract-ref="REELLY-2026-001"
 *   npm run reelly:import -- --limit=20 --contract-ref="…" --with-media
 *
 * IMPORTANT: a Reelly licence grants the right to use the data and imagery.
 * It does not grant a Trakheesi permit. Every project imported here lands as a
 * DRAFT and the publish gate still requires a permit number tied to our own
 * licence before it can go live.
 */
import { getPayload } from "payload";
import config from "../../payload.config";

const BASE = process.env.REELLY_API_BASE ?? "https://api-reelly.up.railway.app/api/v2/clients";
const KEY = process.env.REELLY_API_KEY;

type Envelope<T> = { count: number; next: string | null; previous: string | null; results: T[] };
type ReellyMedia = { url: string; metadata?: { mime?: string; width?: number; height?: number } };
type ReellyProject = Record<string, unknown>;

async function api<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  if (!KEY) {
    throw new Error(
      "REELLY_API_KEY is not set. Add it to .env (it is gitignored) rather than passing it on the command line:\n" +
        "  REELLY_API_KEY=your-key-here",
    );
  }
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const res = await fetch(url, { headers: { "X-API-Key": KEY, Accept: "application/json" } });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 400);
    throw new Error(`Reelly ${res.status} on ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}

/* ---------------------------------------------------------------- discovery */

/**
 * Reelly does not publish the full project schema, so rather than guess field
 * names we read them off a real response and map against evidence.
 */
export async function discover() {
  const page = await api<Envelope<ReellyProject>>("/projects", { limit: 1, offset: 0 });
  console.log(`\nTotal projects available on this key: ${page.count}\n`);

  const sample = page.results[0];
  if (!sample) {
    console.log("The feed returned no results — check the key's entitlements with Reelly.");
    return;
  }

  const describe = (obj: ReellyProject, prefix = ""): void => {
    for (const [k, v] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (v === null || v === undefined) {
        console.log(`  ${path.padEnd(38)} null`);
      } else if (Array.isArray(v)) {
        const first = v[0];
        console.log(`  ${path.padEnd(38)} array[${v.length}]${first && typeof first === "object" ? " of object" : first !== undefined ? ` e.g. ${JSON.stringify(first).slice(0, 40)}` : ""}`);
        if (first && typeof first === "object" && prefix.split(".").length < 2) {
          describe(first as ReellyProject, `${path}[]`);
        }
      } else if (typeof v === "object") {
        console.log(`  ${path.padEnd(38)} object`);
        if (prefix.split(".").length < 2) describe(v as ReellyProject, path);
      } else {
        const s = String(v);
        console.log(`  ${path.padEnd(38)} ${typeof v} = ${s.slice(0, 50)}${s.length > 50 ? "…" : ""}`);
      }
    }
  };

  console.log("Field names on a live project record:\n");
  describe(sample);
  console.log(
    "\nMap these into scripts/ingest/reelly-adapter.ts -> toProjectDraft() before importing.\n",
  );
}

/* ------------------------------------------------------------------ mapping */

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;
const num = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  return undefined;
};

/** Reads a value from the first key that exists — tolerant of naming variance. */
const pick = (o: ReellyProject, ...keys: string[]): unknown => {
  for (const k of keys) {
    const v = k.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];
      return undefined;
    }, o);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

export function extractMedia(p: ReellyProject): string[] {
  const buckets = [
    pick(p, "images"),
    pick(p, "photos"),
    pick(p, "gallery"),
    pick(p, "media"),
    pick(p, "cover"),
    pick(p, "cover_image"),
  ];
  const urls: string[] = [];
  for (const bucket of buckets) {
    if (!bucket) continue;
    const items = Array.isArray(bucket) ? bucket : [bucket];
    for (const item of items) {
      if (typeof item === "string") urls.push(item);
      else if (item && typeof item === "object") {
        const u = (item as ReellyMedia).url;
        if (typeof u === "string") urls.push(u);
      }
    }
  }
  return [...new Set(urls)].filter((u) => /^https?:\/\//.test(u));
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);

export function toProjectDraft(p: ReellyProject, contractRef: string) {
  const name = str(pick(p, "name", "title", "project_name"));
  if (!name) return null;

  const community = str(pick(p, "area", "community", "district", "location.area"));
  const subCommunity = str(pick(p, "sub_community", "subCommunity", "master_plan")) ?? community ?? name;
  const emirateRaw = str(pick(p, "city", "emirate", "region", "location.city")) ?? "Dubai";
  const EMIRATES = ["Dubai", "Abu Dhabi", "Ras Al Khaimah", "Sharjah", "Ajman", "UAQ", "Fujairah"];
  const emirate = EMIRATES.find((e) => emirateRaw.toLowerCase().includes(e.toLowerCase())) ?? "Dubai";

  return {
    slug: `${slugify(name)}-${slugify(subCommunity)}`.slice(0, 100),
    name,
    subCommunity,
    emirate: emirate as "Dubai",
    status: "launched" as const,
    propertyTypes: ["Apartment"] as "Apartment"[],
    bedroomsMin: num(pick(p, "min_bedrooms", "bedrooms_min")) ?? 0,
    bedroomsMax: num(pick(p, "max_bedrooms", "bedrooms_max")) ?? 1,
    priceFromAED: num(pick(p, "min_price", "price_from", "starting_price", "price")) ?? 0,
    sizeFromSqft: num(pick(p, "min_area", "size_from", "area_from")) ?? 0,
    paymentPlan: {
      label: str(pick(p, "payment_plan", "payment_plan_short")) ?? "",
      duringConstructionPct: num(pick(p, "payment_during_construction")),
      onHandoverPct: num(pick(p, "payment_on_handover")),
    },
    handoverQuarter: str(pick(p, "handover_quarter")) as "Q1" | undefined,
    handoverYear: num(pick(p, "handover_year", "completion_year")),
    developerName: str(pick(p, "developer", "developer_name", "developer.name")),
    // Licensed for display — this is what a contract buys and a scrape does not.
    mediaLicence: "developer-supplied" as const,
    mediaLicenceNote: `Licensed feed: Reelly, contract ${contractRef}`,
    alcazarStatus: "monitoring" as const,
    // publishedAt deliberately absent: the Trakheesi gate still applies.
  };
}

/* ------------------------------------------------------------------- import */

async function importProjects() {
  const args = process.argv.slice(2);
  const get = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=");
  const limit = Number(get("limit") ?? 20);
  const contractRef = get("contract-ref");
  const withMedia = args.includes("--with-media");

  if (!contractRef) {
    console.error(
      'Refusing to import without --contract-ref="…".\n' +
        "§11.9 requires the licence recorded against every project, so the right to\n" +
        "display each image is auditable. Use your Reelly contract or subscription ref.",
    );
    process.exit(1);
  }

  const payload = await getPayload({ config });
  let offset = 0;
  let created = 0, skipped = 0, mediaCount = 0;
  const rejected: string[] = [];

  while (created + skipped < limit) {
    const page = await api<Envelope<ReellyProject>>("/projects", {
      limit: Math.min(50, limit - created - skipped),
      offset,
    });
    if (page.results.length === 0) break;

    for (const raw of page.results) {
      const draft = toProjectDraft(raw, contractRef);
      if (!draft) {
        rejected.push("record with no name");
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

      // Resolve or create the developer so the track record card has something.
      let developerId: number | undefined;
      if (draft.developerName) {
        const d = await payload.find({
          collection: "developers",
          where: { name: { equals: draft.developerName } },
          limit: 1,
        });
        developerId = d.docs[0]?.id
          ?? (await payload.create({
            collection: "developers",
            data: {
              slug: slugify(draft.developerName),
              name: draft.developerName,
              alcazarPanelStatus: "selective",
            },
          })).id;
      }

      // developerName is resolved to a relationship above; drop the raw string
      const projectData = { ...draft, developerName: undefined };
      delete (projectData as { developerName?: string }).developerName;
      const project = await payload.create({
        collection: "projects",
        data: { ...projectData, developer: developerId },
      });
      created++;

      if (withMedia) {
        const urls = extractMedia(raw).slice(0, 12);
        const ids: number[] = [];
        for (const [i, url] of urls.entries()) {
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const buf = Buffer.from(await res.arrayBuffer());
            const ext = (url.split(".").pop() ?? "jpg").split("?")[0].slice(0, 4);
            const doc = await payload.create({
              collection: "media",
              data: {
                alt: `${draft.name}, ${draft.subCommunity} — render ${i + 1}`,
                credit: `Licensed via Reelly · contract ${contractRef}`,
              },
              file: {
                data: buf,
                name: `${draft.slug}-${String(i + 1).padStart(3, "0")}.${ext}`,
                mimetype: res.headers.get("content-type") ?? "image/jpeg",
                size: buf.byteLength,
              },
            });
            ids.push(doc.id);
            mediaCount++;
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

      console.log(`  drafted ${draft.slug}${withMedia ? ` (+${extractMedia(raw).length} images)` : ""}`);
    }
    offset += page.results.length;
    if (!page.next) break;
  }

  console.log(`\n${created} drafts created, ${skipped} already present, ${mediaCount} images imported.`);
  if (rejected.length) console.log(`${rejected.length} records rejected.`);
  console.log(
    "\nAll drafts. The publish gate still requires a Trakheesi permit number and an\n" +
      "Alcázar verdict on each one — a data licence is not an advertising permit.\n" +
      "Run `npm run validate:projects` to see exactly what each one still needs.\n",
  );
  process.exit(0);
}

const mode = process.argv.includes("--discover") ? discover : importProjects;
mode().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
