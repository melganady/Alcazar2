import { revalidatePath } from "next/cache";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

/**
 * Rebuilds the pages a listing appears on, the moment it is saved.
 *
 * Pages are statically generated with an hour's revalidation, which is right
 * for traffic and wrong for editing: someone adds a property, opens the site
 * and sees nothing. This closes that gap so publishing in the admin is
 * immediately visible.
 *
 * Both locales, because next-intl serves them as separate routes.
 */
/**
 * revalidatePath needs a Next.js request context. Payload also runs from CLI
 * scripts — imports, seeds, migrations — where there is no server to tell and
 * the call throws, aborting the script. There is nothing to rebuild in that
 * case, so the failure is swallowed deliberately.
 */
const safeRevalidate = (path: string) => {
  try {
    revalidatePath(path);
  } catch {
    // Not running inside the server. Nothing to invalidate.
  }
};

const pathsFor = (slug?: string | null, listingType?: string | null): string[] => {
  const index = listingType === "secondary" ? "/secondary" : "/projects";
  const paths = ["/", index];
  if (slug) paths.push(`/projects/${slug}`);
  return paths.flatMap((p) => [p, `/ar${p === "/" ? "" : p}`]);
};

export const revalidateProject: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  // A slug change orphans the old page unless it is rebuilt too.
  const slugs = new Set([doc?.slug, previousDoc?.slug].filter(Boolean));
  for (const slug of slugs) {
    for (const path of pathsFor(slug as string, doc?.listingType)) {
      safeRevalidate(path);
    }
  }
  return doc;
};

export const revalidateProjectOnDelete: CollectionAfterDeleteHook = ({ doc }) => {
  for (const path of pathsFor(doc?.slug, doc?.listingType)) safeRevalidate(path);
  return doc;
};
