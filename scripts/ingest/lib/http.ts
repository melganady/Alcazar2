import {
  groupFor,
  isAllowed,
  parseRobots,
  xRobotsBlocks,
  type Robots,
} from "./robots";

/**
 * Polite HTTP client for Track A (§5): single concurrency, one request every
 * 2–3 seconds, identifiable User-Agent with a contact address, robots.txt
 * checked before every request. There is no override flag by design.
 */

export const CONTACT_EMAIL = process.env.CRAWLER_CONTACT_EMAIL ?? "tech@alcazar.ae";
export const USER_AGENT = `AlcazarBot/1.0 (+https://alcazar.ae/bot; ${CONTACT_EMAIL})`;

const MIN_DELAY_MS = 2000;
const MAX_DELAY_MS = 3000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class PoliteClient {
  private robotsCache = new Map<string, Robots | null>();
  private lastRequestAt = 0;

  /** Blocks until the politeness window has elapsed. Single concurrency by construction. */
  private async throttle(extraDelayMs = 0) {
    const jitter = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    const wait = Math.max(jitter, extraDelayMs) - (Date.now() - this.lastRequestAt);
    if (wait > 0) await sleep(wait);
    this.lastRequestAt = Date.now();
  }

  async robotsFor(origin: string): Promise<Robots | null> {
    if (this.robotsCache.has(origin)) return this.robotsCache.get(origin)!;
    await this.throttle();
    let robots: Robots | null = null;
    try {
      const res = await fetch(`${origin}/robots.txt`, {
        headers: { "User-Agent": USER_AGENT },
      });
      // 4xx means no restrictions published; 5xx we treat as disallow-all (fail closed).
      if (res.status >= 500) {
        robots = parseRobots("User-agent: *\nDisallow: /");
      } else if (res.ok) {
        robots = parseRobots(await res.text());
      } else {
        robots = parseRobots("");
      }
    } catch {
      robots = parseRobots("User-agent: *\nDisallow: /"); // fail closed
    }
    this.robotsCache.set(origin, robots);
    return robots;
  }

  /**
   * Returns null when robots.txt or X-Robots-Tag disallows the URL —
   * the caller must stop and report, never route around it.
   */
  async get(url: string): Promise<{ html: string; status: number } | null> {
    const u = new URL(url);
    const robots = await this.robotsFor(u.origin);
    if (robots && !isAllowed(robots, USER_AGENT, u.pathname + u.search)) {
      throw new RobotsDisallowedError(url);
    }
    const crawlDelaySec = robots ? groupFor(robots, USER_AGENT)?.crawlDelay : undefined;
    await this.throttle(crawlDelaySec ? crawlDelaySec * 1000 : 0);

    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (xRobotsBlocks(res.headers.get("x-robots-tag"))) {
      throw new RobotsDisallowedError(url, "X-Robots-Tag");
    }
    if (!res.ok) return { html: "", status: res.status };
    return { html: await res.text(), status: res.status };
  }
}

export class RobotsDisallowedError extends Error {
  constructor(url: string, source = "robots.txt") {
    super(`${source} disallows ${url} for ${USER_AGENT}. Stopping — we do not route around this.`);
    this.name = "RobotsDisallowedError";
  }
}
