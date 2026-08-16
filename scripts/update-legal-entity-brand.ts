/*
 * One-off content fix, same shape as update-legal-entity-email.ts.
 *
 * The "Legal entity & licence" global's Brand name field is live database
 * content (edited normally through /admin), not code, so the rebrand didn't
 * touch it. It's still showing the old name on the contact page and
 * anywhere else the compliance strip falls back to it.
 *
 * This ONLY touches brand_name. It deliberately leaves licensed_entity_name
 * alone: that field is the actual DED trade-licence holder, which is a real
 * compliance fact, not a display string — if it still says an old company
 * name, that may mean the trade licence itself hasn't been reissued yet,
 * which isn't something to silently overwrite. This script reports its
 * current value so a human can decide, but never changes it.
 *
 *   DATABASE_URI=<prod postgres uri> npx tsx scripts/update-legal-entity-brand.ts           # dry run (default)
 *   DATABASE_URI=<prod postgres uri> npx tsx scripts/update-legal-entity-brand.ts --commit   # apply
 */
import { Client } from "pg";

const NEW_BRAND = "REIN Investment";
const COMMIT = process.argv.includes("--commit");

const uri = process.env.DATABASE_URI ?? "";
if (!uri.startsWith("postgres")) {
  console.error("Set DATABASE_URI to the production Postgres URI.");
  process.exit(1);
}

const run = async () => {
  const client = new Client({ connectionString: uri });
  await client.connect();

  const { rows } = await client.query(
    `SELECT id, brand_name, licensed_entity_name FROM legal_entity ORDER BY id`,
  );

  if (rows.length === 0) {
    console.log(
      "No row in legal_entity yet — the global has never been saved. " +
        "Open /admin → Globals → Legal entity & licence and hit Save once " +
        "(even with no changes) to create the row, then re-run this script.",
    );
    await client.end();
    process.exit(0);
  }

  if (rows.length > 1) {
    console.log(
      `STOP: found ${rows.length} rows in legal_entity — a Payload global should have exactly one. ` +
        "Not touching anything; this needs a human look first.",
    );
    await client.end();
    process.exit(1);
  }

  const row = rows[0];
  console.log(`Current row: id=${row.id}, brand_name="${row.brand_name}"`);
  console.log(
    `licensed_entity_name="${row.licensed_entity_name ?? "(empty)"}" — left untouched by this script. ` +
      (row.licensed_entity_name && /alc.zar/i.test(row.licensed_entity_name)
        ? "It still looks like it names the old entity — worth checking by hand whether the DED trade licence has actually been reissued under REIN Investment yet, or whether that's still the correct registered name."
        : ""),
  );

  if (row.brand_name === NEW_BRAND) {
    console.log("\nbrand_name already set to the new name. Nothing to do.");
    await client.end();
    process.exit(0);
  }

  console.log(`\nPlan: UPDATE legal_entity SET brand_name = '${NEW_BRAND}' WHERE id = ${row.id};`);

  if (!COMMIT) {
    console.log("\nDry run only — re-run with --commit to apply.");
    await client.end();
    process.exit(0);
  }

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE legal_entity SET brand_name = $1 WHERE id = $2`,
      [NEW_BRAND, row.id],
    );
    await client.query("COMMIT");
    console.log(`Done. ${result.rowCount} row updated.`);

    const { rows: after } = await client.query(
      `SELECT brand_name FROM legal_entity WHERE id = $1`,
      [row.id],
    );
    console.log(`Verified: brand_name is now "${after[0].brand_name}"`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Failed, rolled back:", e);
    process.exit(1);
  }

  await client.end();
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
