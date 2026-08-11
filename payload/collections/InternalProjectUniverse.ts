import type { CollectionConfig } from "payload";

/**
 * Track A (§5) — competitive intelligence only. NOTHING here renders on the
 * site, ever. Three independent guards:
 *   1. publishable is forced false in beforeChange (application layer)
 *   2. a DB CHECK constraint / trigger rejects publishable = true
 *      (scripts/ingest/apply-constraints.ts — the constraint the brief asks for)
 *   3. read access requires an authenticated user, so the REST/GraphQL API
 *      cannot leak it publicly even if a query were written by mistake
 *
 * Facts only. No marketing description text, no media, ever.
 */
export const InternalProjectUniverse: CollectionConfig = {
  slug: "internal-project-universe",
  labels: {
    singular: "Universe entry (internal)",
    plural: "Project universe (internal)",
  },
  admin: {
    useAsTitle: "projectName",
    defaultColumns: ["projectName", "developerName", "community", "handover", "lastSeen"],
    description:
      "Internal competitive intelligence from the discovery crawl. Never published, never rendered. Facts only — no descriptions, no media.",
    group: "Internal",
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Guard 1: this table can never be marked publishable, whatever the caller sends.
        data.publishable = false;
        return data;
      },
    ],
  },
  fields: [
    { name: "fingerprint", type: "text", required: true, unique: true, index: true },
    { name: "projectName", type: "text", required: true },
    { name: "developerName", type: "text" },
    { name: "community", type: "text" },
    { name: "emirate", type: "text" },
    { name: "handover", type: "text", admin: { description: "As published, e.g. 'Q4 2027'" } },
    { name: "paymentPlanLabel", type: "text" },
    { name: "priceFromAED", type: "number" },
    { name: "propertyTypes", type: "text", hasMany: true },
    { name: "bedroomsRange", type: "text" },
    { name: "sourceUrl", type: "text", required: true },
    { name: "sourceHost", type: "text", required: true, index: true },
    { name: "firstSeen", type: "date", required: true },
    { name: "lastSeen", type: "date", required: true },
    {
      name: "publishable",
      type: "checkbox",
      defaultValue: false,
      admin: {
        readOnly: true,
        description: "Always false. Enforced by hook and database constraint.",
      },
    },
    {
      name: "triagedAs",
      type: "select",
      options: ["untriaged", "worth-sourcing", "ignore"],
      defaultValue: "untriaged",
      admin: { description: "Sales-floor triage. 'Worth sourcing' means request the developer pack (Track B)." },
    },
  ],
};
