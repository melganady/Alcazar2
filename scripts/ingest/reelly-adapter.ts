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
  push(p.buildings);
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

/** project_amenities[].amenity.name -> flat list. */
export function mapAmenities(p: ReellyProject): string[] {
  const raw = Array.isArray(p.project_amenities) ? (p.project_amenities as ReellyProject[]) : [];
  const names = raw
    .map((a) => {
      const am = a.amenity;
      if (typeof am === "string") return am;
      if (am && typeof am === "object") {
        const o = am as Record<string, unknown>;
        return str(o.name) ?? str(o.title) ?? str(o.label);
      }
      return str(a.name);
    })
    .filter((n): n is string => Boolean(n));
  return [...new Set(names)];
}

/** project_map_points[] -> the walk/drive times the location section wants. */
export function mapNearbyPlaces(p: ReellyProject) {
  const raw = Array.isArray(p.project_map_points) ? (p.project_map_points as ReellyProject[]) : [];
  return raw
    .map((m) => ({
      name: str(m.map_point_name) ?? "",
      distanceKm: typeof m.distance === "number" ? m.distance : undefined,
      minutes: typeof m.time === "number" ? m.time : undefined,
    }))
    .filter((m) => m.name);
}

/** Every downloadable on the record: floor-plan PDFs and the brochure. */
export function extractDocuments(p: ReellyProject): Array<{ url: string; kind: "floor-plan" | "brochure"; name?: string }> {
  const out: Array<{ url: string; kind: "floor-plan" | "brochure"; name?: string }> = [];
  const plans = Array.isArray(p.floor_plans) ? (p.floor_plans as ReellyProject[]) : [];
  for (const fp of plans) {
    const url = str(fp.file);
    if (url) out.push({ url, kind: "floor-plan", name: str(fp.name) });
  }
  const brochure = str(p.marketing_brochure);
  if (brochure && /^https?:\/\//.test(brochure)) out.push({ url: brochure, kind: "brochure" });
  return out;
}

/** typical_units[].layout -> a per-unit layout image URL. */
export function unitLayoutUrl(unit: ReellyProject): string | undefined {
  const layout = unit.layout;
  const first = Array.isArray(layout) ? layout[0] : layout;
  if (typeof first === "string") return first;
  if (!first || typeof first !== "object") return undefined;
  const o = first as Record<string, unknown>;
  // Reelly nests it: layout[] -> { image: { url }, order }
  const image = o.image;
  if (image && typeof image === "object") {
    const u = (image as Media).url;
    if (typeof u === "string") return u;
  }
  return (o.url as string | undefined) ?? str(o.file);
}

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
    country: "AE" as const,
    // The feed carries off-plan stock only; resale is entered by hand.
    listingType: "offplan" as const,
    region: emirate as "Dubai",
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
    amenities: mapAmenities(p),
    furnishing: str(p.furnishing_display) ?? str(p.furnishing),
    readinessPct:
      typeof p.readiness_progress === "number" ? Math.round(p.readiness_progress) : undefined,
    nearbyPlaces: mapNearbyPlaces(p),
    developerName: str(p.developer),
    mediaLicence: "developer-supplied" as const,
    mediaLicenceNote: `Licensed feed: Reelly, contract ${contractRef}`,
    alcazarStatus: "monitoring" as const,
    isFixture: false,
    // publishedAt deliberately absent — the Trakheesi gate still applies.
  };
}


/* --------------------------------------------------------------- community */

/**
 * Resolves (or creates) the Community record a project sits in. Reelly gives
 * district, sector and coordinates, which is enough for an area page and for
 * the geo block in RealEstateListing JSON-LD.
 */
export async function resolveCommunity(
  payload: Awaited<ReturnType<typeof getPayload>>,
  p: ReellyProject,
): Promise<number | undefined> {
  const district = str(at(p, "location.district"));
  const sector = str(at(p, "location.sector"));
  const name = district ?? sector;
  if (!name) return undefined;

  const region = str(at(p, "location.region")) ?? "Dubai";
  const emirate = EMIRATES.find((e) => region.toLowerCase().includes(e.toLowerCase())) ?? "Dubai";
  const slug = slugify(name);

  const existing = await payload.find({
    collection: "communities",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  if (existing.docs[0]) return existing.docs[0].id;

  const lat = at(p, "location.latitude");
  const lng = at(p, "location.longitude");
  const created = await payload.create({
    collection: "communities",
    data: {
      slug,
      name,
      country: "AE" as const,
    region: emirate as "Dubai",
      lat: typeof lat === "number" ? lat : undefined,
      lng: typeof lng === "number" ? lng : undefined,
    },
  });
  return created.id;
}

/** Re-reads location for already-imported projects and links their community. */
async function backfillCommunities() {
  const payload = await getPayload({ config });
  const projects = await payload.find({
    collection: "projects",
    where: { and: [{ isFixture: { not_equals: true } }, { community: { exists: false } }] },
    limit: 500,
    depth: 0,
  });
  console.log(`\n${projects.totalDocs} projects without a community link.\n`);

  const listing = await api<Envelope<ReellyProject>>("/projects", { limit: 200, offset: 0 });
  const bySlug = new Map<string, ReellyProject>();
  for (const r of listing.results) {
    const name = str(r.name);
    const sector = str(at(r, "location.sector")) ?? str(at(r, "location.district")) ?? name;
    if (name && sector) bySlug.set(`${slugify(str(r.slug_name) ?? name)}-${slugify(sector)}`.slice(0, 100), r);
  }

  let linked = 0;
  const unmatched: string[] = [];
  for (const project of projects.docs) {
    const summary = bySlug.get(project.slug);
    if (!summary) {
      unmatched.push(project.slug);
      continue;
    }
    const full = await api<ReellyProject>(`/projects/${summary.id}`).catch(() => summary);
    const communityId = await resolveCommunity(payload, full);
    if (!communityId) {
      unmatched.push(project.slug);
      continue;
    }
    await payload.update({
      collection: "projects",
      id: project.id,
      data: { community: communityId },
    });
    linked++;
  }

  const communities = await payload.count({ collection: "communities" });
  console.log(`${linked} projects linked, ${communities.totalDocs} communities on file.`);
  if (unmatched.length) console.log(`${unmatched.length} unmatched: ${unmatched.slice(0, 6).join(", ")}`);
  process.exit(0);
}


/* ----------------------------------------------------------- media backfill */

/**
 * Tops up projects imported under a lower image cap.
 *
 * extractMedia returns a deterministic order (cover, architecture, interior,
 * lobby, master plan), so a project already holding N images needs the tail
 * from index N onward — no dedupe lookup and no re-downloading what we have.
 */
async function backfillMedia() {
  const args = process.argv.slice(2);
  const get = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=");
  const contractRef = get("contract-ref");
  const cap = Number(get("max-images") ?? 30);

  if (!contractRef) {
    console.error('Refusing to import media without --contract-ref="…" (§11.9).');
    process.exit(1);
  }

  const payload = await getPayload({ config });
  const projects = await payload.find({
    collection: "projects",
    where: { isFixture: { not_equals: true } },
    limit: 500,
    depth: 1,
  });

  const listing = await api<Envelope<ReellyProject>>("/projects", { limit: 200, offset: 0 });
  const bySlug = new Map<string, ReellyProject>();
  for (const r of listing.results) {
    const name = str(r.name);
    const sector = str(at(r, "location.sector")) ?? str(at(r, "location.district")) ?? name;
    if (name && sector) {
      bySlug.set(`${slugify(str(r.slug_name) ?? name)}-${slugify(sector)}`.slice(0, 100), r);
    }
  }

  let added = 0;
  let toppedUp = 0;
  const unmatched: string[] = [];

  for (const project of projects.docs) {
    const summary = bySlug.get(project.slug);
    if (!summary) {
      unmatched.push(project.slug);
      continue;
    }
    const full = await api<ReellyProject>(`/projects/${summary.id}`).catch(() => summary);
    const urls = extractMedia(full).slice(0, cap);

    const existingGalleryIds = (project.media?.gallery ?? [])
      .map((g) => (typeof g === "object" && g !== null ? g.id : g))
      .filter((id): id is number => typeof id === "number");
    const have = (project.media?.hero ? 1 : 0) + existingGalleryIds.length;
    if (urls.length <= have) continue;

    const newIds: number[] = [];
    for (let i = have; i < urls.length; i++) {
      try {
        const res = await fetch(urls[i]);
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        const mime = res.headers.get("content-type") ?? "image/jpeg";
        const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
        const doc = await payload.create({
          collection: "media",
          data: {
            alt: `${project.name}, ${project.subCommunity} — render ${i + 1}`,
            credit: `Licensed via Reelly · contract ${contractRef}`,
          },
          file: {
            data: buf,
            name: `${project.slug}-${String(i + 1).padStart(3, "0")}.${ext}`,
            mimetype: mime,
            size: buf.byteLength,
          },
        });
        newIds.push(doc.id);
        added++;
      } catch {
        /* one bad asset never fails the run */
      }
    }

    if (newIds.length > 0) {
      await payload.update({
        collection: "projects",
        id: project.id,
        data: {
          media: {
            hero:
              project.media?.hero && typeof project.media.hero === "object"
                ? project.media.hero.id
                : project.media?.hero,
            gallery: [...existingGalleryIds, ...newIds],
          },
        },
      });
      toppedUp++;
      console.log(`  ${project.slug}: ${have} -> ${have + newIds.length} images`);
    }
  }

  console.log(`\n${added} images added across ${toppedUp} projects.`);
  if (unmatched.length) console.log(`${unmatched.length} unmatched: ${unmatched.slice(0, 5).join(", ")}`);
  process.exit(0);
}


/* --------------------------------------------------------- full backfill */

/**
 * Pulls everything the feed holds for projects already imported: remaining
 * renders (no cap), floor-plan PDFs, the marketing brochure, per-unit layout
 * images, amenities, nearby places, furnishing and construction progress.
 *
 * Every asset is credited to the contract, because the licence is what makes
 * any of it publishable.
 */
async function backfillEverything() {
  const args = process.argv.slice(2);
  const get = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=");
  const contractRef = get("contract-ref");
  if (!contractRef) {
    console.error('Refusing to import without --contract-ref="…" (§11.9).');
    process.exit(1);
  }

  const payload = await getPayload({ config });
  const projects = await payload.find({
    collection: "projects",
    where: { isFixture: { not_equals: true } },
    limit: 500,
    depth: 1,
  });

  const listing = await api<Envelope<ReellyProject>>("/projects", { limit: 200, offset: 0 });
  const bySlug = new Map<string, ReellyProject>();
  for (const r of listing.results) {
    const name = str(r.name);
    const sector = str(at(r, "location.sector")) ?? str(at(r, "location.district")) ?? name;
    if (name && sector) {
      bySlug.set(`${slugify(str(r.slug_name) ?? name)}-${slugify(sector)}`.slice(0, 100), r);
    }
  }

  const upload = async (
    url: string,
    name: string,
    alt: string,
  ): Promise<number | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      const mime = res.headers.get("content-type") ?? "application/octet-stream";
      const doc = await payload.create({
        collection: "media",
        data: { alt, credit: `Licensed via Reelly · contract ${contractRef}` },
        file: { data: buf, name, mimetype: mime, size: buf.byteLength },
      });
      return doc.id;
    } catch {
      return null;
    }
  };

  let images = 0;
  let plans = 0;
  let brochures = 0;
  let layouts = 0;
  let enriched = 0;

  for (const project of projects.docs) {
    const summary = bySlug.get(project.slug);
    if (!summary) continue;
    const full = await api<ReellyProject>(`/projects/${summary.id}`).catch(() => null);
    if (!full) continue;

    // --- remaining renders, uncapped ---
    const urls = extractMedia(full);
    const existingGalleryIds = (project.media?.gallery ?? [])
      .map((g) => (typeof g === "object" && g !== null ? g.id : g))
      .filter((id): id is number => typeof id === "number");
    const have = (project.media?.hero ? 1 : 0) + existingGalleryIds.length;
    const newImageIds: number[] = [];
    for (let i = have; i < urls.length; i++) {
      const ext = urls[i].split("?")[0].split(".").pop()?.slice(0, 4) ?? "jpg";
      const id = await upload(
        urls[i],
        `${project.slug}-${String(i + 1).padStart(3, "0")}.${ext}`,
        `${project.name}, ${project.subCommunity} — render ${i + 1}`,
      );
      if (id) {
        newImageIds.push(id);
        images++;
      }
    }

    // --- floor plans and the brochure ---
    const existingPlanIds = (project.media?.floorPlans ?? [])
      .map((g) => (typeof g === "object" && g !== null ? g.id : g))
      .filter((id): id is number => typeof id === "number");
    const newPlanIds: number[] = [];
    let brochureId: number | undefined;

    if (existingPlanIds.length === 0 || !project.media?.brochure) {
      for (const [i, doc] of extractDocuments(full).entries()) {
        const ext = doc.url.split("?")[0].split(".").pop()?.slice(0, 4) ?? "pdf";
        if (doc.kind === "floor-plan" && existingPlanIds.length === 0) {
          const id = await upload(
            doc.url,
            `${project.slug}-floorplan-${String(i + 1).padStart(2, "0")}.${ext}`,
            `${project.name} — floor plans`,
          );
          if (id) {
            newPlanIds.push(id);
            plans++;
          }
        }
        if (doc.kind === "brochure" && !project.media?.brochure) {
          const id = await upload(doc.url, `${project.slug}-brochure.${ext}`, `${project.name} — brochure`);
          if (id) {
            brochureId = id;
            brochures++;
          }
        }
      }
    }

    // --- per-unit layout images ---
    const feedUnits = Array.isArray(full.typical_units) ? (full.typical_units as ReellyProject[]) : [];
    const unitTypes = await Promise.all(
      (project.unitTypes ?? []).map(async (u, i) => {
        if (u.floorPlan) return u;
        const layoutUrl = feedUnits[i] ? unitLayoutUrl(feedUnits[i]) : undefined;
        if (!layoutUrl) return u;
        const ext = layoutUrl.split("?")[0].split(".").pop()?.slice(0, 4) ?? "webp";
        const id = await upload(
          layoutUrl,
          `${project.slug}-layout-${String(i + 1).padStart(2, "0")}.${ext}`,
          `${project.name} — ${u.label} layout`,
        );
        if (!id) return u;
        layouts++;
        return { ...u, floorPlan: id };
      }),
    );

    await payload.update({
      collection: "projects",
      id: project.id,
      data: {
        media: {
          hero:
            project.media?.hero && typeof project.media.hero === "object"
              ? project.media.hero.id
              : project.media?.hero,
          gallery: [...existingGalleryIds, ...newImageIds],
          floorPlans: [...existingPlanIds, ...newPlanIds],
          brochure: brochureId ?? project.media?.brochure,
        },
        unitTypes,
        amenities: mapAmenities(full),
        furnishing: str(full.furnishing_display) ?? str(full.furnishing),
        readinessPct:
          typeof full.readiness_progress === "number"
            ? Math.round(full.readiness_progress)
            : undefined,
        nearbyPlaces: mapNearbyPlaces(full),
      },
    });
    enriched++;
    if (newImageIds.length || newPlanIds.length || brochureId) {
      console.log(
        `  ${project.slug}: +${newImageIds.length} renders, +${newPlanIds.length} plans${brochureId ? ", +brochure" : ""}`,
      );
    }
  }

  console.log(
    `\n${enriched} projects enriched · ${images} renders · ${plans} floor plans · ${brochures} brochures · ${layouts} unit layouts.`,
  );
  process.exit(0);
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

    const communityId = await resolveCommunity(payload, full);

    const { developerName, ...rest } = draft;
    void developerName; // resolved to a relationship above
    const project = await payload.create({
      collection: "projects",
      data: { ...rest, developer: developerId, community: communityId },
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
      "Trakheesi number and an REIN Investment verdict. Run `npm run validate:projects`.\n",
  );
  process.exit(0);
}

if (process.argv[1]?.includes("reelly-adapter")) {
  const mode = process.argv.includes("--discover")
    ? discover
    : process.argv.includes("--backfill-all")
      ? backfillEverything
      : process.argv.includes("--backfill-communities")
        ? backfillCommunities
        : process.argv.includes("--backfill-media")
          ? backfillMedia
          : importProjects;
  mode().catch((err) => {
    console.error(`\n${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
