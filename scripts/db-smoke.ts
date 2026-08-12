/*
 * Smoke-tests whatever database DATABASE_URI points at.
 *
 * The app was built entirely on SQLite, and Postgres is a different adapter
 * with different schema generation and query building. Rather than discover
 * that during a deploy, this creates a record, checks that the publish gate
 * and the fixture guard behave, confirms relationships populate across the
 * join tables, and deletes what it made.
 *
 * Safe to run against a live database: it writes two throwaway records under
 * probe-* slugs and removes them, and never touches existing content.
 *
 *   DATABASE_URI=<neon string> PAYLOAD_SECRET=<secret> npm run db:smoke
 */
import { getPayload } from "payload";
import config from "../payload.config";

let failures = 0;

const ok = (label: string) => console.log(`  ok    ${label}`);
const bad = (label: string, why: unknown) => {
  failures++;
  console.log(`  FAIL  ${label} — ${why instanceof Error ? why.message : String(why)}`);
};
const check = (passed: boolean, label: string, why: string) =>
  passed ? ok(label) : bad(label, why);

const run = async () => {
  const payload = await getPayload({ config });
  const uri = process.env.DATABASE_URI ?? "";
  console.log(`\n${uri.startsWith("postgres") ? "Postgres" : "SQLite"} write path\n`);

  // A previous run that failed part-way leaves records behind. Clear them
  // first so the script is safe to re-run.
  for (const collection of ["projects", "developers"] as const) {
    await payload.delete({
      collection,
      where: { slug: { like: "probe-" } },
      overrideAccess: true,
    });
  }

  const dev = await payload.create({
    collection: "developers",
    data: { slug: "probe-developer", name: "Probe Developer" } as never,
  });
  ok(`created developer #${dev.id}`);

  const base = {
    slug: "probe-project",
    name: "Probe Project",
    country: "AE" as const,
    region: "Dubai" as const,
    subCommunity: "Business Bay",
    developer: dev.id,
    priceFromAED: 1_500_000,
    sizeFromSqft: 900,
    bedroomsMin: 1,
    bedroomsMax: 3,
    status: "launched" as const,
    alcazarStatus: "monitoring" as const,
    mediaLicence: "developer-supplied" as const,
    propertyTypes: ["Apartment"],
    paymentPlan: { label: "60/40" },
  };

  const draft = await payload.create({ collection: "projects", data: base as never });
  ok(`created project draft #${draft.id}`);

  // Gate must refuse an incomplete publish when the override is off.
  delete process.env.ALLOW_INCOMPLETE_PUBLISH;
  try {
    await payload.update({
      collection: "projects",
      id: draft.id,
      data: { publishedAt: new Date().toISOString() },
    });
    bad("publish gate blocks an incomplete record", "it allowed the publish");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    ok(`publish gate refused: ${msg.slice(0, 90)}…`);
  }

  // …and must let it through when the operator has set the override.
  process.env.ALLOW_INCOMPLETE_PUBLISH = "true";
  const published = await payload.update({
    collection: "projects",
    id: draft.id,
    data: { publishedAt: new Date().toISOString() },
  });
  ok(`override published it (publishedAt ${String(published.publishedAt).slice(0, 10)})`);

  // Relationship population across the join tables. Checked before the
  // fixture flag goes on, because the guard is supposed to drop a flagged
  // relation — which would make this look like a Postgres fault.
  const withDev = await payload.find({
    collection: "projects",
    where: { slug: { equals: "probe-project" } },
    depth: 1,
  });
  const rel = withDev.docs[0]?.developer;
  check(
    typeof rel === "object" && rel !== null,
    "relationship populated across the join table",
    `got ${typeof rel}`,
  );

  // The fixture guard is deliberately inactive without the production flag —
  // development wants to see the seed data. Asserting it here regardless
  // would report a failure for correct behaviour.
  if (process.env.EXCLUDE_FIXTURES !== "true") {
    console.log("  skip  fixture guard — EXCLUDE_FIXTURES is not set (development default)");
  } else {
    await payload.update({
      collection: "developers",
      id: dev.id,
      data: { isFixture: true },
    });
    const anon = await payload.find({
      collection: "developers",
      where: { slug: { equals: "probe-developer" } },
      overrideAccess: true,
    });
    check(
      anon.totalDocs === 0,
      "fixture guard hid the flagged developer from a public read",
      `returned ${anon.totalDocs} doc(s)`,
    );

    // …and the guard reaches relationship population too, so a flagged
    // developer degrades to a bare id rather than surfacing on a page.
    const afterFlag = await payload.find({
      collection: "projects",
      where: { slug: { equals: "probe-project" } },
      depth: 1,
    });
    check(
      typeof afterFlag.docs[0]?.developer === "number",
      "flagged relation degraded to an id, not rendered",
      "the flagged developer still populated",
    );
  }

  // Clean up so the probe database matches a fresh deploy.
  await payload.delete({ collection: "projects", id: draft.id });
  await payload.delete({ collection: "developers", id: dev.id });
  ok("probe records deleted");

  // Non-zero exit so this can gate a deploy rather than just print.
  console.log(failures === 0 ? "\nDatabase clear.\n" : `\n${failures} check(s) failed.\n`);
  process.exit(failures === 0 ? 0 : 1);
};

run().catch((err: unknown) => {
  // Payload nests field errors, and the default dump prints "[Object]" for
  // each — useless when the whole point is knowing which field failed.
  const fieldErrors = (err as { data?: { errors?: Array<{ path?: string; message?: string }> } })
    ?.data?.errors;
  if (fieldErrors?.length) {
    console.error("\nValidation failed:");
    for (const e of fieldErrors) console.error(`  ${e.path ?? "?"}: ${e.message ?? ""}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
