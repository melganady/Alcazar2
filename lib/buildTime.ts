/**
 * Guards a build-time query against a database that is not reachable yet.
 *
 * `generateStaticParams` runs during the build, which means Payload boots and
 * queries there — so a missing PAYLOAD_SECRET or DATABASE_URI does not merely
 * degrade the site, it fails the whole deploy before a single page is written.
 * That is a bad trade on the very first deploy of a project, where the app is
 * usually wired up before the database is.
 *
 * When the query fails, the route falls back to an empty list: nothing is
 * prerendered and those pages are generated on demand instead, which is what
 * `dynamicParams` already allows. The moment the environment is set, the next
 * build prerenders them as before.
 *
 * Deliberately noisy. A silent empty build would be worse than a failed one —
 * the log line is what tells you the site went up without its content.
 */
export async function staticParamsOrEmpty<T>(
  label: string,
  query: () => Promise<T[]>,
): Promise<T[]> {
  try {
    return await query();
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(
      `[build] ${label}: no params prerendered — ${reason}\n` +
        `        These pages will render on demand. Set PAYLOAD_SECRET and DATABASE_URI ` +
        `to prerender them; run "npm run preflight" to check.`,
    );
    return [];
  }
}
