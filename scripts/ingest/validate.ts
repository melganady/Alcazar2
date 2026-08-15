/**
 * Publish gate report (§5). The gate itself is enforced in the Projects
 * beforeChange hook — this script tells the team what is blocking each
 * draft, so the fix list is concrete rather than trial-and-error.
 *
 *   npm run validate:projects
 */
import { getPayload } from "payload";
import config from "../../payload.config";
import type { Project } from "../../payload-types";

export type GateFailure = { slug: string; name: string; missing: string[] };

/** Same rules as the beforeChange gate, expressed once for reporting. */
export function missingForPublish(project: Partial<Project>): string[] {
  const missing: string[] = [];
  if (!project.mediaLicence || project.mediaLicence === "unlicensed") {
    missing.push("media licence");
  }
  if (!project.trakheesiPermitNumber) missing.push("Trakheesi permit number");
  const verdictEmpty =
    !project.deskVerdict || JSON.stringify(project.deskVerdict).indexOf('"text"') === -1;
  if (verdictEmpty) missing.push("REIN Investment verdict");
  if (!project.developer) missing.push("developer");
  if (!project.handoverQuarter) missing.push("handover quarter");
  if (!project.handoverYear) missing.push("handover year");
  if (
    project.paymentPlan?.duringConstructionPct == null ||
    project.paymentPlan?.onHandoverPct == null
  ) {
    missing.push("payment plan percentages");
  }
  if (project.priceFromAED == null) missing.push("price from (AED)");
  return missing;
}

async function run() {
  const payload = await getPayload({ config });
  const drafts = await payload.find({
    collection: "projects",
    where: { publishedAt: { exists: false } },
    limit: 500,
    depth: 0,
  });

  const failures: GateFailure[] = [];
  for (const doc of drafts.docs) {
    const missing = missingForPublish(doc);
    if (missing.length > 0) {
      failures.push({ slug: doc.slug, name: doc.name, missing });
    }
  }

  console.log(`${drafts.totalDocs} unpublished projects.`);
  console.log(`${drafts.totalDocs - failures.length} ready to publish, ${failures.length} blocked.\n`);
  for (const f of failures) {
    console.log(`  ${f.name} (${f.slug})`);
    for (const m of f.missing) console.log(`      missing: ${m}`);
  }
  process.exit(0);
}

if (process.argv[1]?.includes("validate")) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
