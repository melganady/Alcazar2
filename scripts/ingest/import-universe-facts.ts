/**
 * Loads a local scraped dataset into the INTERNAL universe table as facts only.
 *
 * This exists because market facts — which projects exist, where, at what entry
 * price — are ordinary competitive intelligence. The expressive content in that
 * dataset is not ours to republish: the descriptions are the source site's
 * copy, the photographs are their (watermark-stripped) property, and the
 * reference numbers are their internal identifiers. None of those are read by
 * this importer, and there is no code path here that could carry them.
 *
 * Rows land with publishable = false, enforced by a database trigger. Nothing
 * imported here can ever render on the site, and none of it is a property
 * advertisement — which matters, because advertising a Dubai property without
 * a Trakheesi permit tied to our own licence is an offence regardless of where
 * the facts came from.
 *
 *   npm run import:universe -- --dir="/path/to/projects"
 */
import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { join } from "path";
import { getPayload } from "payload";
import config from "../../payload.config";
import { fingerprint, parsePriceAED } from "./lib/extract";

/** Reads only the whitelisted factual fields. Prose and media are never touched. */
function factsFromDetails(md: string): Record<string, string> {
  const out: Record<string, string> = {};

  const title = md.match(/^#\s+(.+)$/m);
  if (title) out.name = title[1].trim();

  const url = md.match(/^\*\*URL:\*\*\s*(.+)$/m);
  if (url) out.sourceUrl = url[1].trim();

  // Only these bullet keys are read. Anything else in the file is ignored,
  // including the Description section and the Reference number.
  const ALLOWED = new Set([
    "City",
    "Community",
    "Sub-community",
    "Developer",
    "Property Types",
    "Starting Price",
    "Payment Plan",
    "Handover",
  ]);
  for (const m of md.matchAll(/^-\s*([^:]+):\s*(.*)$/gm)) {
    const key = m[1].trim();
    const value = m[2].trim();
    if (ALLOWED.has(key) && value && value !== "N/A") out[key] = value;
  }
  return out;
}

const EMIRATES = [
  "Dubai", "Abu Dhabi", "Ras Al Khaimah", "Sharjah", "Ajman", "Umm Al Quwain", "Fujairah",
];

const run = async () => {
  const args = process.argv.slice(2);
  const dir = args.find((a) => a.startsWith("--dir="))?.split("=").slice(1).join("=");
  if (!dir || !existsSync(dir)) {
    console.error('Usage: --dir="/path/to/projects"');
    process.exit(1);
  }

  const payload = await getPayload({ config });
  const folders = readdirSync(dir).filter((f) => statSync(join(dir, f)).isDirectory());

  let created = 0;
  let updated = 0;
  const skipped = 0;
  const missing: string[] = [];
  const now = new Date().toISOString();

  for (const folder of folders) {
    const detailsPath = join(dir, folder, "details.md");
    if (!existsSync(detailsPath)) {
      missing.push(folder);
      continue;
    }
    const facts = factsFromDetails(readFileSync(detailsPath, "utf8"));
    const name = facts.name;
    if (!name) {
      missing.push(`${folder} (no title)`);
      continue;
    }

    const community = facts["Sub-community"] || facts["Community"] || undefined;
    const city = facts["City"] || "";
    const emirate = EMIRATES.find((e) => city.toLowerCase().includes(e.toLowerCase()))
      ?? (community && EMIRATES.find((e) => community.toLowerCase().includes(e.toLowerCase())))
      ?? undefined;
    const host = facts.sourceUrl ? new URL(facts.sourceUrl).host : "local-dataset";

    const data = {
      fingerprint: fingerprint(name, community, host),
      projectName: name,
      developerName: facts["Developer"] || undefined,
      community,
      emirate,
      handover: facts["Handover"] || undefined,
      paymentPlanLabel: facts["Payment Plan"] || undefined,
      priceFromAED: facts["Starting Price"] ? parsePriceAED(facts["Starting Price"]) : undefined,
      propertyTypes: facts["Property Types"]
        ? facts["Property Types"].split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      sourceUrl: facts.sourceUrl ?? `local-dataset/${folder}`,
      sourceHost: host,
      lastSeen: now,
    };

    const existing = await payload.find({
      collection: "internal-project-universe",
      where: { fingerprint: { equals: data.fingerprint } },
      limit: 1,
    });

    if (existing.docs[0]) {
      await payload.update({
        collection: "internal-project-universe",
        id: existing.docs[0].id,
        data,
      });
      updated++;
    } else {
      await payload.create({
        collection: "internal-project-universe",
        data: { ...data, firstSeen: now, triagedAs: "untriaged" },
      });
      created++;
    }
  }

  console.log(`\n${folders.length} folders read.`);
  console.log(`  ${created} new universe entries, ${updated} updated, ${skipped} skipped.`);
  if (missing.length > 0) {
    console.log(`\n  ${missing.length} folders had no readable details.md:`);
    for (const m of missing.slice(0, 15)) console.log(`      ${m}`);
    if (missing.length > 15) console.log(`      … and ${missing.length - 15} more`);
  }
  console.log("\nFacts only. No descriptions, no photographs, no reference numbers.");
  console.log("All rows publishable = false. None of this renders on the site.\n");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
