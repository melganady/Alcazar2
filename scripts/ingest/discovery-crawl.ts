/**
 * TRACK A — internal discovery crawl (§5).
 *
 * Builds an internal universe list of which off-plan projects exist, for
 * competitive intelligence and a new-launch alert to the sales floor.
 *
 * Hard boundaries, enforced in code rather than documented as intent:
 *   · robots.txt and X-Robots-Tag are obeyed; a disallow stops the run
 *   · one request every 2–3s, single concurrency, identifiable UA + contact
 *   · no images, renders, floor plans or brochures are ever requested
 *   · no marketing description text is stored — see lib/extract.ts
 *   · rows land in internal-project-universe with publishable = false,
 *     enforced by a DB constraint (scripts/ingest/apply-constraints.ts)
 *
 * Nothing this script writes is rendered on the website.
 *
 * Run:  npm run crawl -- --source=<key> --confirm
 * Sources are configured below; add one per portal you have decided to survey.
 */
import { getPayload } from "payload";
import * as cheerio from "cheerio";
import config from "../../payload.config";
import { PoliteClient, RobotsDisallowedError, USER_AGENT } from "./lib/http";
import { factsFromCardText, type UniverseFact } from "./lib/extract";

type SourceProfile = {
  key: string;
  origin: string;
  /** Listing pages to survey. Keep this short — this is a survey, not a mirror. */
  paths: string[];
  /** Selector for a project card, and for the fields we are permitted to read. */
  card: string;
  name: string;
  community?: string;
  developer?: string;
  link?: string;
  /** Hard cap on pages per run. A survey never needs more. */
  maxPages: number;
};

const SOURCES: SourceProfile[] = [
  {
    key: "luxuryproperty",
    origin: "https://www.luxuryproperty.com",
    paths: ["/projects"],
    card: "[class*='project-card'], article",
    name: "h2, h3, [class*='title']",
    community: "[class*='community'], [class*='location']",
    developer: "[class*='developer']",
    link: "a[href]",
    maxPages: 3,
  },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
  return {
    source: get("source"),
    confirmed: args.includes("--confirm"),
    checkOnly: args.includes("--check-robots"),
  };
}

async function extractFromListing(
  html: string,
  profile: SourceProfile,
  pageUrl: string,
): Promise<UniverseFact[]> {
  const $ = cheerio.load(html);
  const facts: UniverseFact[] = [];

  $(profile.card).each((_, el) => {
    const card = $(el);
    const projectName = card.find(profile.name).first().text().trim();
    if (!projectName || projectName.length > 120) return;

    const community = profile.community
      ? card.find(profile.community).first().text().trim() || undefined
      : undefined;
    const developerName = profile.developer
      ? card.find(profile.developer).first().text().trim() || undefined
      : undefined;
    const href = profile.link ? card.find(profile.link).first().attr("href") : undefined;
    const sourceUrl = href ? new URL(href, pageUrl).toString() : pageUrl;

    // Card text goes through the fact extractor, which can only emit the
    // permitted identifier fields. Prose is discarded, never stored.
    facts.push(
      factsFromCardText(card.text().replace(/\s+/g, " "), {
        projectName,
        community,
        developerName,
        sourceUrl,
      }),
    );
  });

  return facts;
}

async function run() {
  const { source, confirmed, checkOnly } = parseArgs();
  const profile = SOURCES.find((s) => s.key === source);

  if (!profile) {
    console.error(`Unknown source. Configured: ${SOURCES.map((s) => s.key).join(", ")}`);
    process.exit(1);
  }

  const client = new PoliteClient();

  // Step 1 — always check robots.txt first and report what it permits.
  console.log(`User-Agent: ${USER_AGENT}`);
  console.log(`Checking ${profile.origin}/robots.txt ...`);
  const robots = await client.robotsFor(profile.origin);
  const { isAllowed } = await import("./lib/robots");
  const verdicts = profile.paths.map((p) => ({
    path: p,
    allowed: robots ? isAllowed(robots, USER_AGENT, p) : true,
  }));
  for (const v of verdicts) {
    console.log(`  ${v.allowed ? "ALLOWED " : "DISALLOWED"}  ${v.path}`);
  }

  const blocked = verdicts.filter((v) => !v.allowed);
  if (blocked.length > 0) {
    console.error(
      `\nrobots.txt disallows ${blocked.map((b) => b.path).join(", ")} for our agent.` +
        `\nStopping. We do not route around this — source the data from the developer instead (Track B).`,
    );
    process.exit(2);
  }
  if (checkOnly) {
    console.log("\nCheck-only mode: robots verdict above, nothing crawled.");
    process.exit(0);
  }
  if (!confirmed) {
    console.error(
      "\nRefusing to crawl without --confirm. This makes live requests to a third-party site.",
    );
    process.exit(1);
  }

  // Step 2 — survey, facts only.
  const payload = await getPayload({ config });
  const now = new Date().toISOString();
  const seen: UniverseFact[] = [];

  for (const path of profile.paths.slice(0, profile.maxPages)) {
    const url = `${profile.origin}${path}`;
    console.log(`GET ${url}`);
    try {
      const res = await client.get(url);
      if (!res || res.status !== 200) {
        console.warn(`  skipped (status ${res?.status ?? "error"})`);
        continue;
      }
      const facts = await extractFromListing(res.html, profile, url);
      console.log(`  ${facts.length} projects identified`);
      seen.push(...facts);
    } catch (err) {
      if (err instanceof RobotsDisallowedError) {
        console.error(`\n${err.message}`);
        process.exit(2);
      }
      throw err;
    }
  }

  // Step 3 — upsert and diff for the new-launch alert.
  const newLaunches: string[] = [];
  for (const fact of seen) {
    const existing = await payload.find({
      collection: "internal-project-universe",
      where: { fingerprint: { equals: fact.fingerprint } },
      limit: 1,
    });
    if (existing.docs[0]) {
      await payload.update({
        collection: "internal-project-universe",
        id: existing.docs[0].id,
        data: { ...fact, lastSeen: now },
      });
    } else {
      await payload.create({
        collection: "internal-project-universe",
        data: { ...fact, firstSeen: now, lastSeen: now, triagedAs: "untriaged" },
      });
      newLaunches.push(`${fact.projectName}${fact.community ? `, ${fact.community}` : ""}`);
    }
  }

  console.log(`\n${seen.length} entries surveyed, ${newLaunches.length} new since last run.`);
  if (newLaunches.length > 0) {
    console.log("\nNEW LAUNCH ALERT — for the sales floor:");
    for (const n of newLaunches) console.log(`  · ${n}`);
  }
  console.log("\nAll rows are internal, publishable = false. Nothing here renders on the site.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
