/*
 * Flags seed data that predates the isFixture field on its collection.
 *
 * The seeder invented lenders, developers, consultants and articles before
 * those collections carried a flag, so the rows are indistinguishable from
 * real ones by shape alone. They are identified here by the fingerprints the
 * seeder left, and everything it wrote is marked in one pass.
 *
 * Reelly-imported records are never touched: they carry a source contract
 * reference and none of the fixture fingerprints.
 *
 * Run: npm run mark:fixtures
 */
import { getPayload } from "payload";
import config from "../payload.config";

const FIXTURE_DEVELOPERS = [
  "Meridian Developments",
  "Qamar Properties",
  "Northlight Group",
  "Sable & Stone",
  "Helios Living",
  "Marlin Bay Developments",
  "Vantage One",
  "Karam Estates",
];

const FIXTURE_LENDERS = [
  "Gulf First Bank",
  "Emirates Capital Bank",
  "Alnoor Bank",
  "Crescent Home Finance",
  "Meydan National Bank",
];

const run = async () => {
  const payload = await getPayload({ config });
  let total = 0;

  const flag = async (
    collection: "developers" | "communities" | "lenders" | "agents" | "articles",
    where: Record<string, unknown>,
    label: string,
  ) => {
    await payload.update({
      collection,
      where: where as never,
      data: { isFixture: true } as never,
      overrideAccess: true,
    });
    // Counted rather than taken from the update result: collections with
    // drafts enabled return the updated docs differently, and a script that
    // reports "0 flagged" while flagging three is worse than no report.
    const { totalDocs: n } = await payload.count({
      collection,
      where: { isFixture: { equals: true } },
      overrideAccess: true,
    });
    total += n;
    console.log(`  ${String(n).padStart(3)} ${collection} — ${label}`);
  };

  console.log("Marking seed data:");

  // Invented companies. Named explicitly rather than matched on a field, so a
  // real developer that happens to have a track record is never swept up.
  await flag("developers", { name: { in: FIXTURE_DEVELOPERS } }, "invented developers");
  await flag("lenders", { name: { in: FIXTURE_LENDERS } }, "invented lenders");

  // Every agent and article in the database came from the seeder. Both
  // collections are empty until the desk writes its own.
  await flag("agents", { id: { exists: true } }, "placeholder consultants");
  await flag("articles", { id: { exists: true } }, "placeholder editorial");

  // Communities are real places, but the seeded ones carry invented price and
  // yield statistics. The flag hides the invented figures, not the place —
  // Reelly's own record for the same area is untouched and stays visible.
  await flag(
    "communities",
    { avgPricePerSqft: { exists: true } },
    "areas with unverified price statistics",
  );

  console.log(`\n${total} records flagged. They stay visible in /admin and to signed-in editors.`);
  console.log("Set EXCLUDE_FIXTURES=true to hide them from the public site.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
