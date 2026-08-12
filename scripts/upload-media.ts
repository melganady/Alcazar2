/*
 * Uploads the local media/ directory to the configured S3/R2 bucket.
 *
 * Media is no longer carried in the repository — 1.2 GB of developer renders
 * does not belong in a deployment bundle. Production reads them from object
 * storage, so the bucket has to be filled once before the first deploy;
 * Payload's media rows already reference these filenames.
 *
 * Skips anything already present with a matching size, so it is safe to
 * re-run after an interrupted upload.
 *
 *   npm run upload:media -- --dry-run
 *   npm run upload:media
 */
import { readdir, stat, readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const dryRun = process.argv.includes("--dry-run");
const DIR = "media";

const {
  S3_BUCKET,
  S3_ENDPOINT,
  S3_REGION = "auto",
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
} = process.env;

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

const run = async () => {
  if (!S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    console.error(
      "Missing bucket credentials. Set S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.",
    );
    process.exit(1);
  }

  const files = (await readdir(DIR)).filter((f) => !f.startsWith("."));
  console.log(`${files.length} file(s) in ${DIR}/${dryRun ? " — dry run" : ""}\n`);

  const client = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
  });

  let uploaded = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const [i, name] of files.entries()) {
    const path = join(DIR, name);
    const { size } = await stat(path);

    try {
      const head = await client.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: name }));
      if (head.ContentLength === size) {
        skipped++;
        continue;
      }
    } catch {
      // Not in the bucket yet — that is the normal path on a first run.
    }

    if (dryRun) {
      uploaded++;
      continue;
    }

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: name,
          Body: await readFile(path),
          ContentType: CONTENT_TYPES[extname(name).toLowerCase()] ?? "application/octet-stream",
        }),
      );
      uploaded++;
    } catch (err) {
      failed.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
    }

    if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${files.length}`);
  }

  console.log(
    `\n${uploaded} ${dryRun ? "would upload" : "uploaded"}, ${skipped} already present, ${failed.length} failed.`,
  );
  for (const f of failed.slice(0, 20)) console.log(`  ${f}`);
  process.exit(failed.length > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
