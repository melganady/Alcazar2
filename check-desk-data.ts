/*
 * READ-ONLY diagnostic. Runs SELECTs only — no ALTER, no UPDATE, no DELETE.
 *
 * Answers one question: after the rename, is the desk data where it should be,
 * stranded in the old columns, or was it never there in the first place?
 *
 *   DATABASE_URI=<prod postgres uri> npx tsx check-desk-data.ts
 */
import { Client } from "pg";

const PAIRS: { table: string; old: string; neu: string; label: string }[] = [
  { table: "projects", old: "alcazar_status", neu: "desk_status", label: "desk status" },
  { table: "projects", old: "alcazar_verdict", neu: "desk_verdict", label: "desk verdict" },
  {
    table: "projects",
    old: "alcazar_filter_scores_developer_record",
    neu: "filter_scores_developer_record",
    label: "filter score (developer record)",
  },
  {
    table: "developers",
    old: "alcazar_panel_status",
    neu: "panel_status",
    label: "developer panel status",
  },
];

const uri = process.env.DATABASE_URI ?? "";
if (!uri.startsWith("postgres")) {
  console.error("Set DATABASE_URI to the production Postgres URI.");
  process.exit(1);
}

const exists = async (c: InstanceType<typeof Client>, table: string, col: string) => {
  const { rows } = await c.query(
    `SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2`,
    [table, col],
  );
  return rows.length > 0;
};

const filled = async (c: InstanceType<typeof Client>, table: string, col: string) => {
  const { rows } = await c.query(
    `SELECT count(*)::text AS n FROM "${table}" WHERE "${col}" IS NOT NULL`,
  );
  return rows[0].n as string;
};

const run = async () => {
  const client = new Client({ connectionString: uri });
  await client.connect();

  const { rows: totals } = await client.query(
    `SELECT (SELECT count(*) FROM projects)::text AS p, (SELECT count(*) FROM developers)::text AS d`,
  );
  console.log(`\nRows in production: ${totals[0].p} projects, ${totals[0].d} developers\n`);

  let stranded = false;

  for (const { table, old, neu, label } of PAIRS) {
    const hasOld = await exists(client, table, old);
    const hasNew = await exists(client, table, neu);
    const oldN = hasOld ? await filled(client, table, old) : "-";
    const newN = hasNew ? await filled(client, table, neu) : "-";

    let verdict: string;
    if (hasOld && hasNew) {
      verdict =
        Number(oldN) > 0
          ? `STRANDED — ${oldN} row(s) still in the old column, recoverable`
          : "both columns exist, but the old one is empty — nothing lost";
      if (Number(oldN) > 0) stranded = true;
    } else if (hasNew && !hasOld) {
      verdict =
        Number(newN) > 0
          ? `OK — migrated, ${newN} row(s) carry data`
          : "OK — migrated, but no row ever had a value here";
    } else if (hasOld && !hasNew) {
      verdict = "old column only — the renamed config has not deployed yet";
    } else {
      verdict = "neither column found (unexpected)";
    }

    console.log(`${label}`);
    console.log(`  old ${old}: ${hasOld ? `present, ${oldN} filled` : "absent"}`);
    console.log(`  new ${neu}: ${hasNew ? `present, ${newN} filled` : "absent"}`);
    console.log(`  -> ${verdict}\n`);
  }

  console.log(
    stranded
      ? "ACTION NEEDED: data is sitting in the old columns. Do not write to these\n" +
          "fields in /admin until it is copied across, or you will mix old and new."
      : "No stranded data found.",
  );

  await client.end();
  process.exit(0);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
