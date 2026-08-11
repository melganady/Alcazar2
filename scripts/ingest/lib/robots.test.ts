import { describe, expect, it } from "vitest";
import { isAllowed, parseRobots, xRobotsBlocks } from "./robots";

const SAMPLE = `
# comment
User-agent: *
Disallow: /admin
Disallow: /search
Allow: /projects
Crawl-delay: 10

User-agent: BadBot
Disallow: /

Sitemap: https://example.com/sitemap.xml
`;

describe("parseRobots", () => {
  it("reads groups, rules, crawl-delay and sitemaps", () => {
    const r = parseRobots(SAMPLE);
    expect(r.groups).toHaveLength(2);
    expect(r.sitemaps).toEqual(["https://example.com/sitemap.xml"]);
    expect(r.groups[0].crawlDelay).toBe(10);
  });
  it("groups consecutive user-agent lines together", () => {
    const r = parseRobots("User-agent: a\nUser-agent: b\nDisallow: /x");
    expect(r.groups).toHaveLength(1);
    expect(r.groups[0].agents).toEqual(["a", "b"]);
  });
  it("ignores comments and blank lines", () => {
    const r = parseRobots("# nothing\n\nUser-agent: *\nDisallow: /y # trailing");
    expect(r.groups[0].rules).toEqual([{ type: "disallow", pattern: "/y" }]);
  });
});

describe("isAllowed", () => {
  const r = parseRobots(SAMPLE);
  it("allows paths with no matching rule", () => {
    expect(isAllowed(r, "AlcazarBot", "/about")).toBe(true);
  });
  it("blocks disallowed prefixes", () => {
    expect(isAllowed(r, "AlcazarBot", "/admin/users")).toBe(false);
    expect(isAllowed(r, "AlcazarBot", "/search?q=x")).toBe(false);
  });
  it("honours an explicit Allow", () => {
    expect(isAllowed(r, "AlcazarBot", "/projects/seaside")).toBe(true);
  });
  it("applies the agent-specific group over the wildcard", () => {
    expect(isAllowed(r, "BadBot/1.0", "/projects")).toBe(false);
    expect(isAllowed(r, "AlcazarBot/1.0", "/projects")).toBe(true);
  });
  it("longest match wins, Allow wins ties", () => {
    const rr = parseRobots("User-agent: *\nDisallow: /a\nAllow: /a/b");
    expect(isAllowed(rr, "x", "/a/c")).toBe(false);
    expect(isAllowed(rr, "x", "/a/b/c")).toBe(true);
    const tie = parseRobots("User-agent: *\nDisallow: /p\nAllow: /p");
    expect(isAllowed(tie, "x", "/p")).toBe(true);
  });
  it("supports * wildcards and $ anchors", () => {
    const rr = parseRobots("User-agent: *\nDisallow: /*.pdf$");
    expect(isAllowed(rr, "x", "/files/brochure.pdf")).toBe(false);
    expect(isAllowed(rr, "x", "/files/brochure.pdf?v=1")).toBe(true);
  });
  it("treats a bare Disallow: as allow-all", () => {
    const rr = parseRobots("User-agent: *\nDisallow:");
    expect(isAllowed(rr, "x", "/anything")).toBe(true);
  });
  it("blocks everything under Disallow: /", () => {
    const rr = parseRobots("User-agent: *\nDisallow: /");
    expect(isAllowed(rr, "x", "/")).toBe(false);
    expect(isAllowed(rr, "x", "/projects")).toBe(false);
  });
});

describe("xRobotsBlocks", () => {
  it("treats noindex/none as blocking", () => {
    expect(xRobotsBlocks("noindex, nofollow")).toBe(true);
    expect(xRobotsBlocks("none")).toBe(true);
    expect(xRobotsBlocks("noai")).toBe(true);
  });
  it("allows when absent or permissive", () => {
    expect(xRobotsBlocks(null)).toBe(false);
    expect(xRobotsBlocks("all")).toBe(false);
  });
});
