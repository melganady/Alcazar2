/**
 * robots.txt parsing and enforcement (§5 Track A).
 * If a path is disallowed we stop and report — we never route around it.
 * Longest-match-wins per RFC 9309, with Allow winning ties.
 */

export type RobotsRule = { type: "allow" | "disallow"; pattern: string };
export type RobotsGroup = { agents: string[]; rules: RobotsRule[]; crawlDelay?: number };
export type Robots = { groups: RobotsGroup[]; sitemaps: string[] };

export function parseRobots(text: string): Robots {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotsGroup | null = null;
  let lastLineWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === "user-agent") {
      if (!current || !lastLineWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastLineWasAgent = true;
      continue;
    }
    lastLineWasAgent = false;

    if (field === "sitemap") {
      sitemaps.push(value);
      continue;
    }
    if (!current) continue;
    if (field === "allow" || field === "disallow") {
      current.rules.push({ type: field, pattern: value });
    } else if (field === "crawl-delay") {
      const n = Number(value);
      if (!Number.isNaN(n)) current.crawlDelay = n;
    }
  }
  return { groups, sitemaps };
}

/** Most specific group for this agent: exact token match beats the `*` group. */
export function groupFor(robots: Robots, userAgent: string): RobotsGroup | null {
  const ua = userAgent.toLowerCase();
  let wildcard: RobotsGroup | null = null;
  let best: RobotsGroup | null = null;
  let bestLen = -1;

  for (const g of robots.groups) {
    for (const a of g.agents) {
      if (a === "*") {
        wildcard = wildcard ?? g;
      } else if (ua.includes(a) && a.length > bestLen) {
        best = g;
        bestLen = a.length;
      }
    }
  }
  return best ?? wildcard;
}

/** Glob match supporting robots `*` and end-anchor `$`. */
function matches(pattern: string, path: string): boolean {
  if (pattern === "") return false;
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const parts = body.split("*").map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`^${parts.join(".*")}${anchored ? "$" : ""}`);
  return re.test(path);
}

export function isAllowed(robots: Robots, userAgent: string, path: string): boolean {
  const group = groupFor(robots, userAgent);
  if (!group) return true; // no applicable group: nothing is disallowed

  let decision: { type: "allow" | "disallow"; len: number } | null = null;
  for (const rule of group.rules) {
    if (!matches(rule.pattern, path)) continue;
    const len = rule.pattern.length;
    if (
      !decision ||
      len > decision.len ||
      (len === decision.len && rule.type === "allow")
    ) {
      decision = { type: rule.type, len };
    }
  }
  // An empty Disallow: means allow-all, handled by matches() returning false.
  return decision ? decision.type === "allow" : true;
}

/** X-Robots-Tag response header — respected exactly like robots.txt (§5). */
export function xRobotsBlocks(headerValue: string | null): boolean {
  if (!headerValue) return false;
  const v = headerValue.toLowerCase();
  return v.includes("noindex") || v.includes("none") || v.includes("noai");
}
