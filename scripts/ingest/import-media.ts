/**
 * TRACK B — media import from a developer pack (§5, §11.9).
 *
 * Ingests a folder of renders supplied by the developer, attaches them to a
 * project as hero + gallery, and records the permission grant that makes them
 * publishable. Alt text is derived from the project name.
 *
 *   npm run import:media -- \
 *     --slug=seaside-dubai-islands \
 *     --dir="./packs/seaside/renders" \
 *     --licence-note="Pack from A. Nasser, Meridian, 2026-08-11"
 *
 * The licence note is mandatory. Without it there is no record of who gave us
 * the right to publish the images, and §11.9 says no image renders without one.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { basename, extname, join } from "path";
import { getPayload } from "payload";
import config from "../../payload.config";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

/** "seaside-dubai-islands" + photo_003 -> "Seaside, Dubai Islands — render 3" */
function altFor(projectName: string, subCommunity: string, index: number): string {
  return `${projectName}, ${subCommunity} — render ${index}`;
}

const run = async () => {
  const args = process.argv.slice(2);
  const get = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=");
  const slug = get("slug");
  const dir = get("dir");
  const licenceNote = get("licence-note");
  const dryRun = args.includes("--dry-run");

  if (!slug || !dir) {
    console.error('Usage: --slug=<project-slug> --dir=<folder> --licence-note="who supplied it, when"');
    process.exit(1);
  }
  if (!licenceNote) {
    console.error(
      "Refusing to import media without --licence-note.\n" +
        "§11.9: no image renders without a recorded permission grant. Log who supplied\n" +
        "the pack and when, so the right to publish is auditable.",
    );
    process.exit(1);
  }
  if (!existsSync(dir)) {
    console.error(`No such folder: ${dir}`);
    process.exit(1);
  }

  const payload = await getPayload({ config });

  const found = await payload.find({
    collection: "projects",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  const project = found.docs[0];
  if (!project) {
    console.error(`No project with slug "${slug}". Import the fact sheet first:`);
    console.error("  npm run import:developer -- --file=<pack.csv> --licence-note=…");
    process.exit(1);
  }

  const files = readdirSync(dir)
    .filter((f) => IMAGE_EXT.has(extname(f).toLowerCase()))
    .filter((f) => statSync(join(dir, f)).isFile())
    .sort();

  if (files.length === 0) {
    console.error(`No images in ${dir} (looked for ${[...IMAGE_EXT].join(", ")})`);
    process.exit(1);
  }

  console.log(`${project.name}, ${project.subCommunity}`);
  console.log(`  ${files.length} images in ${dir}`);
  if (dryRun) {
    files.forEach((f, i) => console.log(`    ${f} → "${altFor(project.name, project.subCommunity, i + 1)}"`));
    console.log("\nDry run — nothing written.");
    process.exit(0);
  }

  const uploaded: number[] = [];
  for (const [i, file] of files.entries()) {
    const doc = await payload.create({
      collection: "media",
      data: {
        alt: altFor(project.name, project.subCommunity, i + 1),
        credit: `Render supplied by the developer · ${licenceNote}`,
      },
      file: {
        data: readFileSync(join(dir, file)),
        name: `${slug}-${basename(file)}`,
        mimetype: `image/${extname(file).slice(1).replace("jpg", "jpeg")}`,
        size: statSync(join(dir, file)).size,
      },
    });
    uploaded.push(doc.id);
    process.stdout.write(`    uploaded ${i + 1}/${files.length}\r`);
  }
  console.log(`    uploaded ${uploaded.length}/${files.length}   `);

  await payload.update({
    collection: "projects",
    id: project.id,
    data: {
      media: {
        ...(project.media ?? {}),
        hero: uploaded[0],
        gallery: uploaded.slice(1),
      },
      mediaLicence: "developer-supplied",
      mediaLicenceNote: licenceNote,
    },
  });

  console.log(`\n  hero + ${uploaded.length - 1} gallery images attached.`);
  console.log(`  mediaLicence: developer-supplied · ${licenceNote}`);
  console.log(
    project.trakheesiPermitNumber
      ? "\n  Trakheesi permit present — this project can publish."
      : "\n  Still blocked from publishing: no Trakheesi permit number yet.",
  );
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
