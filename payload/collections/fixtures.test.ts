import { describe, expect, it, afterEach } from "vitest";
import type { CollectionBeforeOperationHook, Where } from "payload";
import { hideFixtures } from "./shared";

/**
 * The seeded demo content invents lenders that quote LTVs, developers with
 * delivery statistics, and consultants with names and BRNs. On a licensed
 * brokerage's live site any of it would be a misrepresentation, so the guard
 * that keeps it off the public site is worth pinning down.
 */

type HookArgs = Parameters<CollectionBeforeOperationHook>[0];

// The hook's return type is a union across every Payload operation. The
// tests only ever read `where`, so it is narrowed here rather than at each
// assertion.
const call = (overrides: Partial<HookArgs> = {}): { where?: Where } =>
  hideFixtures({
    args: {},
    operation: "read",
    collection: {} as never,
    context: {} as never,
    req: {} as never,
    ...overrides,
  } as HookArgs) as unknown as { where?: Where };

const original = process.env.EXCLUDE_FIXTURES;
afterEach(() => {
  if (original === undefined) delete process.env.EXCLUDE_FIXTURES;
  else process.env.EXCLUDE_FIXTURES = original;
});

describe("hideFixtures", () => {
  it("leaves reads untouched in development, where the demo content is the point", () => {
    delete process.env.EXCLUDE_FIXTURES;
    expect(call().where).toBeUndefined();
  });

  it("constrains reads once the production flag is set", () => {
    process.env.EXCLUDE_FIXTURES = "true";
    expect(call().where).toEqual({ isFixture: { not_equals: true } });
  });

  it("preserves the caller's own filter rather than replacing it", () => {
    process.env.EXCLUDE_FIXTURES = "true";
    const where = { slug: { equals: "one-crescent-palm" } };
    expect(call({ args: { where } as unknown as HookArgs["args"] }).where).toEqual({
      and: [where, { isFixture: { not_equals: true } }],
    });
  });

  it("still shows fixtures to a signed-in editor, who has to find them to delete them", () => {
    process.env.EXCLUDE_FIXTURES = "true";
    const req = { user: { id: 1, email: "admin@alcazar.ae" } } as never;
    expect(call({ req }).where).toBeUndefined();
  });

  it("does not touch writes — a fixture must stay editable and deletable", () => {
    process.env.EXCLUDE_FIXTURES = "true";
    for (const operation of ["create", "update", "delete"] as const) {
      expect(call({ operation }).where).toBeUndefined();
    }
  });
});
