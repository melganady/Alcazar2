import type { CollectionBeforeOperationHook, Field, Where } from "payload";

/**
 * Marks a record as development seed data.
 *
 * The seeded demo content reads as real — invented lenders with rates,
 * developers with delivery statistics, consultants with names. On a licensed
 * brokerage's site any of that would be a misrepresentation, so it carries a
 * flag and the flag is enforced at read time.
 */
export const fixtureField: Field = {
  name: "isFixture",
  type: "checkbox",
  defaultValue: false,
  admin: {
    position: "sidebar",
    description: "Development seed data — excluded from production builds.",
  },
};

/**
 * Hides seed data from the public site when EXCLUDE_FIXTURES=true.
 *
 * Applied as a read-time constraint rather than at each query, because there
 * are two dozen of those and one will eventually be forgotten. Signed-in
 * admins still see fixtures — they are the ones who have to find and delete
 * them.
 */
export const hideFixtures: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation !== "read") return args;
  if (process.env.EXCLUDE_FIXTURES !== "true") return args;
  if (req?.user) return args;
  // findByID carries an id and no filter. Nothing here reaches a fixture that
  // way: every public page finds by slug, and the id lookups are relationship
  // population from a document that already passed this guard.
  if ("id" in args) return args;

  const query = args as { where?: Where };
  const notFixture: Where = { isFixture: { not_equals: true } };
  query.where = query.where ? { and: [query.where, notFixture] } : notFixture;
  return args;
};

export const EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Ras Al Khaimah",
  "Sharjah",
  "Ajman",
  "UAQ",
  "Fujairah",
];

export const PROPERTY_TYPES = [
  "Apartment",
  "Penthouse",
  "Townhouse",
  "Villa",
  "Sky Villa",
  "Duplex",
  "Mansion",
  "Hotel Room",
  "Office",
];
