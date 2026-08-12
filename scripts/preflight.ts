/**
 * Pre-deploy check. Separates what BLOCKS a deploy from what is merely
 * missing, so going live is a decision made with the list in front of you
 * rather than a surprise afterwards.
 *
 *   npm run preflight
 */
const required = [
  ["PAYLOAD_SECRET", "signs admin sessions"],
  ["DATABASE_URI", "postgres:// in production — SQLite is not persistent on Vercel"],
  ["NEXT_PUBLIC_SITE_URL", "canonical URLs, sitemaps and OG image links"],
] as const;

const storage = [
  ["S3_BUCKET", "uploads are lost on redeploy without object storage"],
  ["S3_ENDPOINT", ""],
  ["S3_ACCESS_KEY_ID", ""],
  ["S3_SECRET_ACCESS_KEY", ""],
] as const;

const optional = [
  ["REELLY_API_KEY", "project + media import"],
  ["HUBSPOT_ACCESS_TOKEN", "leads reach the CRM; without it they stay in Payload only"],
  ["RESEND_API_KEY", "autoresponder; without it replies are console-logged"],
  ["EMAIL_FROM", "autoresponder sender"],
  ["TURNSTILE_SECRET_KEY", "form spam protection"],
  ["NEXT_PUBLIC_MAPBOX_TOKEN", "map view on /projects"],
] as const;

const has = (k: string) => Boolean(process.env[k]?.trim());
const line = (ok: boolean, k: string, why: string) =>
  `  ${ok ? "ok  " : "MISS"}  ${k.padEnd(28)} ${ok ? "" : why}`;

let blocking = 0;

console.log("\nBLOCKING — the site will not run correctly without these");
for (const [k, why] of required) {
  if (!has(k)) blocking++;
  console.log(line(has(k), k, why));
}

const dbIsPg = (process.env.DATABASE_URI ?? "").startsWith("postgres");
if (!dbIsPg) {
  blocking++;
  console.log("  MISS  DATABASE_URI                  is not a postgres:// URI — SQLite does not persist on Vercel");
}

console.log("\nMEDIA — required if you are serving uploaded renders");
for (const [k, why] of storage) console.log(line(has(k), k, why));
if (!has("S3_BUCKET")) {
  console.log("        note: without a bucket, uploaded media is written to the container filesystem and lost on redeploy.");
}

console.log("\nOPTIONAL — each degrades gracefully");
for (const [k, why] of optional) console.log(line(has(k), k, why));

console.log(
  blocking === 0
    ? "\nPreflight clear.\n"
    : `\n${blocking} blocking item${blocking === 1 ? "" : "s"}. Set them in the host's environment before deploying.\n`,
);
process.exit(blocking === 0 ? 0 : 1);
