/*
 * One-off schema migration for the REIN Investment rebrand.
 *
 * Four Payload fields carried the old brand name. Renaming them in the config
 * alone would NOT move the data: Payload would add the new columns empty and
 * leave the old ones orphaned, silently blanking every desk verdict, status
 * and filter score in the database. This script renames the underlying columns
 * (and the Postgres enum types behind the two select fields) so the data
 * arrives under the new names intact.
 *
 *   alcazar_status                -> desk_status          (projects)
 *   alcazar_verdict               -> desk_verdict         (projects)
 *   alcazar_filter_scores_*       -> filter_scores_*      (projects, 8 cols)
 *   alcazar_panel_status          -> panel_status         (developers)
 *
 * RUN THIS BEFORE DEPLOYING THE RENAMED CONFIG.
 *
 * It is idempotent and introspective: it renames only what it actually finds,
 * skips anything already migrated, and refuses to clobber a new-name column
 * that already exists alongside an old one. Safe to run twice.
 *
 *   npm run migrate:desk-fields          # dry run — prints the plan, changes nothing
 *   npm run migrate:desk-fields -- --commit
 *
 * Postgres runs the whole thing in a transaction, so it either all lands or
 * none of it does. SQLite (local dev) has transactional DDL too.
 */
import { Client } from "pg";

type Rename = { table: string; from: string; to: string };

const COLUMN_RENAMES: Rename[] = [
  { table: "projects", from: "alcazar_status", to: "desk_status" },
  { table: "projects", from: "alcazar_verdict", to: "desk_verdict" },
  { table: "developers", from: "alcazar_panel_status", to: "panel_status" },
  ...[
    "developer_record",
    "regulatory_standing",
    "price_vs_comparables",
    "payment_structure",
    "supply_in_window",
    "exit_terms",
    "running_cost",
    "unit_quality",
  ].map((c) => ({
    table: "projects",
    from: `alcazar_filter_scores_${c}`,
    to: `filter_scores_${c}`,
  })),
];

const TYPE_RENAMES = [
  { from: "enum_projects_alcazar_status", to: "enum_projects_desk_status" },
  {
    from: "enum_developers_alcazar_panel_status",
    to: "enum_developers_panel_status",
  },
];

const uri = process.env.DATABASE_URI ?? "";
const commit = process.argv.includes("--commit");

if (!uri) {
  console.error("DATABASE_URI is not set. Point it at the database you mean to migrate.");
  process.exit(1);
}

if (!uri.startsWith("postgres")) {
  console.error(
    `DATABASE_URI is not a Postgres URI (${uri.slice(0, 24)}...).\n` +
      "Local SQLite dev databases do not need this migration — delete the .db file\n" +
      "and re-seed instead. This script only targets the deployed Postgres database.",
  );
  process.exit(1);
}

const run = async () => {
  const client = new Client({ connectionString: uri });
  await client.connect();

  const plan: string[] = [];
  const skipped: string[] = [];
  const blocked: string[] = [];

  for (const { table, from, to } of COLUMN_RENAMES) {
    const { rows } = await client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = $1 AND column_name = ANY($2)`,
      [table, [from, to]],
    );
    const names = rows.map((r) => r.column_name);
    const hasOld = names.includes(from);
    const hasNew = names.includes(to);

    if (hasOld && hasNew) {
      blocked.push(
        `${table}.${from} -> ${to}: BOTH columns exist. The renamed config was probably ` +
          `deployed before this migration ran, so Payload created "${to}" empty. Copy the ` +
          `values across and drop the old column by hand — this script will not guess.`,
      );
    } else if (hasOld) {
      plan.push(`ALTER TABLE "${table}" RENAME COLUMN "${from}" TO "${to}";`);
    } else if (hasNew) {
      skipped.push(`${table}.${to} (already renamed)`);
    } else {
      skipped.push(`${table}.${from} (not present)`);
    }
  }

  for (const { from, to } of TYPE_RENAMES) {
    const { rows } = await client.query<{ typname: string }>(
      `SELECT typname FROM pg_type WHERE typname = ANY($1)`,
      [[from, to]],
    );
    const names = rows.map((r) => r.typname);
    if (names.includes(from) && !names.includes(to)) {
      plan.push(`ALTER TYPE "${from}" RENAME TO "${to}";`);
    } else if (names.includes(to)) {
      skipped.push(`type ${to} (already renamed)`);
    } else {
      skipped.push(`type ${from} (not present)`);
    }
  }

  for (const s of skipped) console.log(`  skip  ${s}`);
  for (const b of blocked) console.error(`  STOP  ${b}`);

  if (blocked.length > 0) {
    console.error("\nRefusing to run: resolve the conflicts above first.");
    await client.end();
    process.exit(1);
  }

  if (plan.length === 0) {
    console.log("\nNothing to do — this database is already on the new names.");
    await client.end();
    process.exit(0);
  }

  console.log("");
  for (const sql of plan) console.log(`  ${commit ? "run " : "plan"}  ${sql}`);

  if (!commit) {
    console.log(
      `\n${plan.length} statement(s) planned. Nothing was changed.\n` +
        "Re-run with --commit to apply.",
    );
    await client.end();
    process.exit(0);
  }

  // Count the rows carrying data, so the log records what was actually moved
  // rather than just that the DDL succeeded.
  const before = await client.query<{ n: string }>(
    `SELECT count(*)::text AS n FROM projects WHERE alcazar_verdict IS NOT NULL`,
  ).catch(() => ({ rows: [{ n: "n/a" }] }));

  try {
    await client.query("BEGIN");
    for (const sql of plan) await client.query(sql);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\nMigration failed and was rolled back. Nothing changed.");
    console.error(err);
    await client.end();
    process.exit(1);
  }

  const after = await client.query<{ n: string }>(
    `SELECT count(*)::text AS n FROM projects WHERE desk_verdict IS NOT NULL`,
  );
  console.log(
    `\nDone. Desk verdicts carrying data: ${before.rows[0].n} before, ${after.rows[0].n} after.`,
  );
  console.log("Deploy the renamed config now.");

  await client.end();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
