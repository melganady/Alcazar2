import { revalidatePath } from "next/cache";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload } from "payload";

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

const bothLocales = (path: string): string[] => [path, `/ar${path === "/" ? "" : path}`];

const pathsFor = (slug?: string | null, listingType?: string | null): string[] => {
  const index = listingType === "secondary" ? "/secondary" : "/projects";
  // A project's directory count contributes to both the developer and the
  // community listing pages, whichever project it is.
  const paths = ["/", index, "/developers", "/communities"];
  if (slug) paths.push(`/projects/${slug}`);
  return paths.flatMap(bothLocales);
};

/** Resolves a relationship id to the slug its detail page is served under. */
async function relatedSlug(
  payload: Payload,
  collection: "developers" | "communities",
  id: unknown,
): Promise<string | null> {
  if (typeof id !== "number" && typeof id !== "string") return null;
  try {
    const doc = await payload.findByID({ collection, id, depth: 0 });
    return typeof doc?.slug === "string" ? doc.slug : null;
  } catch {
    return null;
  }
}

export const revalidateProject: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  // A slug change orphans the old page unless it is rebuilt too.
  const slugs = new Set([doc?.slug, previousDoc?.slug].filter(Boolean));
  for (const slug of slugs) {
    for (const path of pathsFor(slug as string, doc?.listingType)) {
      safeRevalidate(path);
    }
  }

  // Assigning/reassigning a developer or community changes what that
  // entity's own detail page shows (its project count, its price floor).
  const devIds = new Set([doc?.developer, previousDoc?.developer].filter((v) => v != null));
  const communityIds = new Set([doc?.community, previousDoc?.community].filter((v) => v != null));
  for (const id of devIds) {
    const slug = await relatedSlug(req.payload, "developers", id);
    if (slug) bothLocales(`/developers/${slug}`).forEach(safeRevalidate);
  }
  for (const id of communityIds) {
    const slug = await relatedSlug(req.payload, "communities", id);
    if (slug) bothLocales(`/communities/${slug}`).forEach(safeRevalidate);
  }

  return doc;
};

export const revalidateProjectOnDelete: CollectionAfterDeleteHook = ({ doc }) => {
  for (const path of pathsFor(doc?.slug, doc?.listingType)) safeRevalidate(path);
  return doc;
};

/** For direct edits to a developer or community record itself. */
export const revalidateDirectoryEntry =
  (kind: "developers" | "communities"): CollectionAfterChangeHook =>
  ({ doc, previousDoc }) => {
    const indexPath = kind === "developers" ? "/developers" : "/communities";
    bothLocales(indexPath).forEach(safeRevalidate);
    bothLocales("/").forEach(safeRevalidate);
    const slugs = new Set([doc?.slug, previousDoc?.slug].filter(Boolean));
    for (const slug of slugs) {
      bothLocales(`${indexPath}/${slug}`).forEach(safeRevalidate);
    }
    return doc;
  };

export const revalidateDirectoryEntryOnDelete =
  (kind: "developers" | "communities"): CollectionAfterDeleteHook =>
  ({ doc }) => {
    const indexPath = kind === "developers" ? "/developers" : "/communities";
    bothLocales(indexPath).forEach(safeRevalidate);
    if (doc?.slug) bothLocales(`${indexPath}/${doc.slug}`).forEach(safeRevalidate);
    return doc;
  };
