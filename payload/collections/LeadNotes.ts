import type { CollectionConfig } from "payload";
import { adminOnly, staffOnly } from "./crmShared";

/**
 * Free-text notes against a lead. Every note also drops a one-line entry
 * into the activity feed so the lead's timeline reads as one story instead
 * of two separate tabs.
 *
 * Known v1 limitation: any authenticated team member can read/edit any
 * note by ID (not just the lead's assigned agent) — the strict boundary
 * lives on the Lead itself (an agent can't discover a lead, so can't
 * discover its notes, outside the CRM UI). Tightening this to a true
 * relationship-aware access rule is a fast-follow, not a blocker for v1.
 */
export const LeadNotes: CollectionConfig = {
  slug: "lead-notes",
  labels: { singular: "Lead note", plural: "Lead notes" },
  admin: {
    useAsTitle: "body",
    defaultColumns: ["lead", "author", "createdAt"],
    group: "CRM",
  },
  access: {
    read: staffOnly,
    create: staffOnly,
    update: staffOnly,
    delete: adminOnly,
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== "create") return;
        try {
          await req.payload.create({
            collection: "lead-activity",
            data: {
              lead: doc.lead,
              kind: "note",
              message: `Note added: "${String(doc.body).slice(0, 140)}${String(doc.body).length > 140 ? "…" : ""}"`,
              actor: doc.author ?? req.user?.id,
            },
          });
        } catch (err) {
          req.payload.logger.error(`lead-activity write failed (note): ${String(err)}`);
        }
      },
    ],
  },
  fields: [
    { name: "lead", type: "relationship", relationTo: "leads", required: true, index: true },
    { name: "body", type: "textarea", required: true },
    { name: "author", type: "relationship", relationTo: "users", required: true },
  ],
  timestamps: true,
};
