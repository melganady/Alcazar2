/*
 * One-off content fix: the "Legal entity & licence" global's Email field is
 * live database content (edited normally through /admin), not code — so it
 * didn't move when the codebase was rebranded. It's still carrying whatever
 * was seeded before the rebrand.
 *
 * This updates just that one field, directly, the same way you'd do it by
 * hand in the admin UI — just without needing the admin password.
 *
 *   DATABASE_URI=<prod postgres uri> npx tsx scripts/update-legal-entity-email.ts           # dry run (default)
 *   DATABASE_URI=<prod postgres uri> npx tsx scripts/update-legal-entity-email.ts --commit   # apply
 */
import { Client } from "pg";

const NEW_EMAIL = "hello@rein-international.com";
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
    `SELECT id, brand_name, email FROM legal_entity ORDER BY id`,
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
  console.log(`Current row: id=${row.id}, brand="${row.brand_name}", email="${row.email}"`);

  if (row.email === NEW_EMAIL) {
    console.log("Already set to the new address. Nothing to do.");
    await client.end();
    process.exit(0);
  }

  console.log(`Plan: UPDATE legal_entity SET email = '${NEW_EMAIL}' WHERE id = ${row.id};`);

  if (!COMMIT) {
    console.log("\nDry run only — re-run with --commit to apply.");
    await client.end();
    process.exit(0);
  }

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE legal_entity SET email = $1 WHERE id = $2`,
      [NEW_EMAIL, row.id],
    );
    await client.query("COMMIT");
    console.log(`Done. ${result.rowCount} row updated.`);

    const { rows: after } = await client.query(
      `SELECT email FROM legal_entity WHERE id = $1`,
      [row.id],
    );
    console.log(`Verified: email is now "${after[0].email}"`);
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
