/*
 * Publishes every draft project that carries a media licence.
 *
 * The publish gate still runs and still names what each record is missing;
 * ALLOW_INCOMPLETE_PUBLISH=true is what lets those gaps through, and the gate
 * logs every one it passes. Run without it and this script publishes only the
 * records that are genuinely complete.
 *
 * Fixtures are never published — invented stock is not inventory.
 *
 *   ALLOW_INCOMPLETE_PUBLISH=true npm run publish:all
 *   npm run publish:all -- --dry-run
 */
import { getPayload } from "payload";
import config from "../payload.config";

const dryRun = process.argv.includes("--dry-run");

const run = async () => {
  const payload = await getPayload({ config });

  const drafts = await payload.find({
    collection: "projects",
    where: {
      and: [
        { publishedAt: { exists: false } },
        { isFixture: { not_equals: true } },
        { mediaLicence: { not_equals: "unlicensed" } },
      ],
    },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  });

  console.log(
    `${drafts.docs.length} licensed draft(s)${dryRun ? " — dry run, nothing will be written" : ""}\n`,
  );

  const now = new Date().toISOString();
  let published = 0;
  const failed: string[] = [];

  for (const doc of drafts.docs) {
    if (dryRun) {
      console.log(`  would publish  ${doc.slug}`);
      continue;
    }
    try {
      await payload.update({
        collection: "projects",
        id: doc.id,
        data: { publishedAt: now, deskStatus: doc.deskStatus ?? "monitoring" },
        overrideAccess: true,
      });
      published++;
    } catch (err) {
      failed.push(`${doc.slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (!dryRun) {
    console.log(`\n${published} published, ${failed.length} refused by the gate.`);
    for (const f of failed) console.log(`  ${f}`);
  }
  process.exit(failed.length > 0 && published === 0 ? 1 : 0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
