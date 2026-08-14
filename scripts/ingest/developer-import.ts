/**
 * TRACK B — developer pack import (§5). This is the data the site actually
 * renders: fact sheets and price lists supplied by developers to the brokers
 * selling their stock, with the permission grant logged against the project.
 *
 *   npm run import:developer -- --file=./packs/meridian-seaside.csv \
 *       --licence-note="Pack from A. Nasser, 2026-08-01"
 *
 * Creates DRAFTS only. Nothing here can publish: the Projects beforeChange
 * gate still requires a Trakheesi permit and our own written verdict, neither
 * of which a developer pack can supply.
 *
 * CSV columns (header row required):
 *   name, subCommunity, community, emirate, developer, propertyTypes,
 *   bedroomsMin, bedroomsMax, priceFromAED, sizeFromSqft, paymentPlanLabel,
 *   duringConstructionPct, onHandoverPct, postHandoverPct, postHandoverMonths,
 *   handoverQuarter, handoverYear, dldProjectNumber, serviceChargeAEDPerSqft
 */
import { readFileSync } from "fs";
import { getPayload } from "payload";
import config from "../../payload.config";

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        cell += c;
      }
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (c === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") {
      cell += c;
    }
  }
  if (cell || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  const [header, ...body] = rows.filter((r) => r.some((c) => c !== ""));
  if (!header) return [];
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ""])));
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const num = (v: string) => (v === "" ? undefined : Number(v.replace(/[^\d.-]/g, "")));

async function run() {
  const args = process.argv.slice(2);
  const get = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=");
  const file = get("file");
  const licenceNote = get("licence-note");

  if (!file) {
    console.error("Usage: --file=<path.csv> --licence-note=\"who supplied it, when\"");
    process.exit(1);
  }
  if (!licenceNote) {
    console.error(
      "Refusing to import without --licence-note. §11.9 requires the media permission grant on record.",
    );
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(file, "utf8"));
  const payload = await getPayload({ config });
  let created = 0;
  let skipped = 0;

  for (const r of rows) {
    if (!r.name || !r.subCommunity) {
      skipped++;
      continue;
    }
    const slug = `${slugify(r.name)}-${slugify(r.subCommunity)}`;

    const existing = await payload.find({
      collection: "projects",
      where: { slug: { equals: slug } },
      limit: 1,
    });
    if (existing.docs[0]) {
      console.log(`  exists, skipping: ${slug}`);
      skipped++;
      continue;
    }

    const dev = r.developer
      ? await payload.find({
          collection: "developers",
          where: { name: { equals: r.developer } },
          limit: 1,
        })
      : null;
    const community = r.community
      ? await payload.find({
          collection: "communities",
          where: { name: { equals: r.community } },
          limit: 1,
        })
      : null;

    await payload.create({
      collection: "projects",
      data: {
        slug,
        name: r.name,
        subCommunity: r.subCommunity,
        community: community?.docs[0]?.id,
        country: "AE" as const,
      // Both importers carry off-plan stock; resale is entered by hand.
      listingType: "offplan" as const,
        region: (r.emirate || "Dubai") as "Dubai",
        developer: dev?.docs[0]?.id,
        status: "launched",
        propertyTypes: (r.propertyTypes || "Apartment")
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean) as "Apartment"[],
        bedroomsMin: num(r.bedroomsMin) ?? 0,
        bedroomsMax: num(r.bedroomsMax) ?? 1,
        priceFromAED: num(r.priceFromAED) ?? 0,
        sizeFromSqft: num(r.sizeFromSqft) ?? 0,
        paymentPlan: {
          label: r.paymentPlanLabel || "",
          duringConstructionPct: num(r.duringConstructionPct),
          onHandoverPct: num(r.onHandoverPct),
          postHandoverPct: num(r.postHandoverPct),
          postHandoverMonths: num(r.postHandoverMonths),
        },
        handoverQuarter: (r.handoverQuarter || undefined) as "Q1" | undefined,
        handoverYear: num(r.handoverYear),
        dldProjectNumber: r.dldProjectNumber || undefined,
        serviceChargeEstimateAEDPerSqft: num(r.serviceChargeAEDPerSqft),
        alcazarStatus: "monitoring",
        mediaLicence: "developer-supplied",
        mediaLicenceNote: licenceNote,
        // publishedAt deliberately unset — the gate still needs a Trakheesi
        // permit and our own verdict, which no developer pack can provide.
      },
    });
    created++;
    console.log(`  draft created: ${slug}`);
  }

  console.log(
    `\n${created} drafts created, ${skipped} skipped. All require a Trakheesi permit and an REIN Investment verdict before they can publish.`,
  );
  process.exit(0);
}

if (process.argv[1]?.includes("developer-import")) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
