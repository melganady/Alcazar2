/**
 * TRACK B — DLD / Dubai REST enrichment (§5). Authoritative public project
 * data: registration number, escrow status, completion percentage, developer
 * entity. Free and citable, unlike anything scraped from a competitor.
 *
 *   npm run enrich:dld -- [--dry-run]
 *
 * The endpoint and payload shape are behind an adapter because Dubai REST
 * access is provisioned per-brokerage; set DLD_API_BASE and DLD_API_KEY once
 * the licence holder has credentials. Without them this runs in report mode
 * and tells you which projects are missing authoritative data.
 */
import { getPayload } from "payload";
import config from "../../payload.config";

export type DldRecord = {
  projectNumber: string;
  escrowConfirmed: boolean;
  completionPct?: number;
  developerEntity?: string;
};

export interface DldSource {
  name: string;
  lookup(params: { projectName: string; developerName?: string }): Promise<DldRecord | null>;
}

/** Live Dubai REST adapter — enabled when credentials exist. */
const restSource = (base: string, key: string): DldSource => ({
  name: "dubai-rest",
  async lookup({ projectName }) {
    const url = `${base}/projects?name=${encodeURIComponent(projectName)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      items?: Array<{
        project_number?: string;
        escrow_account?: string | null;
        percent_completed?: number;
        developer_name?: string;
      }>;
    };
    const hit = json.items?.[0];
    if (!hit?.project_number) return null;
    return {
      projectNumber: hit.project_number,
      escrowConfirmed: Boolean(hit.escrow_account),
      completionPct: hit.percent_completed,
      developerEntity: hit.developer_name,
    };
  },
});

export function getDldSource(): DldSource | null {
  const base = process.env.DLD_API_BASE;
  const key = process.env.DLD_API_KEY;
  return base && key ? restSource(base, key) : null;
}

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  const payload = await getPayload({ config });
  const source = getDldSource();

  const projects = await payload.find({
    collection: "projects",
    where: { isFixture: { not_equals: true } },
    limit: 500,
    depth: 1,
  });

  if (!source) {
    const missing = projects.docs.filter((p) => !p.dldProjectNumber || !p.escrowAccountConfirmed);
    console.log("No DLD credentials configured (DLD_API_BASE, DLD_API_KEY). Report mode.\n");
    console.log(`${projects.totalDocs} non-fixture projects, ${missing.length} missing authoritative DLD data:`);
    for (const p of missing) {
      const gaps = [
        !p.dldProjectNumber ? "project number" : null,
        !p.escrowAccountConfirmed ? "escrow confirmation" : null,
      ].filter(Boolean);
      console.log(`  ${p.name} (${p.slug}) — ${gaps.join(", ")}`);
    }
    process.exit(0);
  }

  let enriched = 0;
  for (const p of projects.docs) {
    const developerName = typeof p.developer === "object" ? p.developer?.name : undefined;
    const record = await source.lookup({ projectName: p.name, developerName });
    if (!record) {
      console.log(`  no DLD match: ${p.slug}`);
      continue;
    }
    console.log(
      `  ${p.slug} → project ${record.projectNumber}, escrow ${record.escrowConfirmed ? "confirmed" : "not confirmed"}${
        record.completionPct != null ? `, ${record.completionPct}% complete` : ""
      }`,
    );
    if (!dryRun) {
      await payload.update({
        collection: "projects",
        id: p.id,
        data: {
          dldProjectNumber: record.projectNumber,
          escrowAccountConfirmed: record.escrowConfirmed,
        },
      });
      enriched++;
    }
  }

  console.log(`\n${enriched} projects enriched${dryRun ? " (dry run — nothing written)" : ""}.`);
  process.exit(0);
}

if (process.argv[1]?.includes("dld-enrich")) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
