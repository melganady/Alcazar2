/**
 * §5 — "Enforce with a DB constraint, not a convention."
 *
 * Applies a database-level guarantee that no row in the internal project
 * universe can ever be marked publishable. Run after any schema push:
 *   npm run db:constraints
 *
 * Postgres gets a CHECK constraint; SQLite (dev) cannot add one after the
 * fact, so it gets equivalent BEFORE INSERT/UPDATE triggers that RAISE.
 */
import { getPayload } from "payload";
import config from "../../payload.config";

const TABLE = "internal_project_universe";

async function run() {
  const payload = await getPayload({ config });
  const uri = process.env.DATABASE_URI ?? "";
  const isPostgres = uri.startsWith("postgres");

  // drizzle instance exposed by both adapters
  const db = payload.db as unknown as {
    drizzle: { run?: (q: unknown) => Promise<unknown>; execute?: (q: unknown) => Promise<unknown> };
  };
  const sqlMod = await import(isPostgres ? "drizzle-orm/pg-core" : "drizzle-orm/sqlite-core").catch(
    () => null,
  );
  void sqlMod;
  const { sql } = await import("drizzle-orm");

  const exec = async (statement: string) => {
    const q = sql.raw(statement);
    if (isPostgres && db.drizzle.execute) return db.drizzle.execute(q);
    if (db.drizzle.run) return db.drizzle.run(q);
    throw new Error("No drizzle execute/run available on this adapter");
  };

  if (isPostgres) {
    await exec(`
      ALTER TABLE ${TABLE}
      DROP CONSTRAINT IF EXISTS ${TABLE}_never_publishable
    `);
    await exec(`
      ALTER TABLE ${TABLE}
      ADD CONSTRAINT ${TABLE}_never_publishable
      CHECK (publishable IS NOT TRUE)
    `);
    console.log(`Postgres CHECK constraint applied: ${TABLE}.publishable can never be true.`);
  } else {
    for (const op of ["insert", "update"] as const) {
      await exec(`DROP TRIGGER IF EXISTS ${TABLE}_never_publishable_${op}`);
      await exec(`
        CREATE TRIGGER ${TABLE}_never_publishable_${op}
        BEFORE ${op.toUpperCase()} ON ${TABLE}
        FOR EACH ROW WHEN NEW.publishable = 1
        BEGIN
          SELECT RAISE(ABORT, 'internal_project_universe rows can never be publishable (Track A, brief §5)');
        END
      `);
    }
    console.log(`SQLite triggers applied: ${TABLE}.publishable can never be true.`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
