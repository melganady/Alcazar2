/**
 * Turns the Track A universe into an actionable sourcing worklist (§5 Track B).
 *
 * The survey tells us which projects exist. This turns that into the list of
 * developer packs to request — the only route by which photography, renders,
 * floor plans and brochures can legally reach our site, because the pack comes
 * with the right to use them and we log the grant against the project.
 *
 *   npm run sourcing:list            # print
 *   npm run sourcing:list -- --csv   # CSV for the sales floor
 */
import { getPayload } from "payload";
import config from "../../payload.config";

const run = async () => {
  const payload = await getPayload({ config });

  const [universe, existing] = await Promise.all([
    payload.find({
      collection: "internal-project-universe",
      limit: 500,
      sort: "-priceFromAED",
    }),
    payload.find({ collection: "projects", limit: 500, depth: 0 }),
  ]);

  const haveAlready = new Set(
    existing.docs.map((p) => `${p.name}|${p.subCommunity}`.toLowerCase()),
  );

  const rows = universe.docs
    .filter((u) => !haveAlready.has(`${u.projectName}|${u.community ?? ""}`.toLowerCase()))
    .map((u) => ({
      project: u.projectName,
      community: u.community ?? "",
      emirate: u.emirate ?? "",
      priceFromAED: u.priceFromAED ?? "",
      developer: u.developerName ?? "UNKNOWN — identify before requesting",
      needed: "fact sheet · price list · payment plan · floor plans · renders · brochure",
      status: u.triagedAs ?? "untriaged",
    }));

  if (process.argv.includes("--csv")) {
    const head = "project,community,emirate,price_from_aed,developer,pack_needed,triage_status";
    const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    console.log(head);
    for (const r of rows) {
      console.log(
        [r.project, r.community, r.emirate, r.priceFromAED, r.developer, r.needed, r.status]
          .map(esc)
          .join(","),
      );
    }
    process.exit(0);
  }

  console.log(`\n${rows.length} projects to source packs for, highest entry price first:\n`);
  for (const r of rows) {
    console.log(`  ${r.project}`);
    console.log(`      ${r.community}${r.emirate ? `, ${r.emirate}` : ""}${r.priceFromAED ? ` · from AED ${Number(r.priceFromAED).toLocaleString()}` : ""}`);
    console.log(`      developer: ${r.developer}`);
  }
  console.log(
    `\nRequest the pack, then: npm run import:developer -- --file=<pack.csv> --licence-note="who supplied it, when"`,
  );
  console.log(
    "Media arrives with the pack and is logged as developer-supplied. That is what makes it publishable.\n",
  );
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
