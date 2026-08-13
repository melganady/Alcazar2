import type { CollectionConfig } from "payload";
import { adminOnly, staffOnly } from "./crmShared";

/**
 * Auto-generated audit trail for a lead — stage changes, (re)assignment,
 * and notification sends — so the lead's activity feed in /crm tells the
 * full story without relying on staff to log everything by hand. Rows are
 * written by hooks (Leads afterChange, Notes/Tasks afterChange), never
 * entered directly by a person.
 */
export const LeadActivity: CollectionConfig = {
  slug: "lead-activity",
  labels: { singular: "Lead activity entry", plural: "Lead activity" },
  admin: {
    useAsTitle: "message",
    defaultColumns: ["lead", "kind", "message", "createdAt"],
    description: "Auto-generated audit trail. Not edited by hand — see the CRM lead page.",
    group: "CRM",
  },
  access: {
    read: staffOnly,
    create: staffOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: "lead", type: "relationship", relationTo: "leads", required: true, index: true },
    {
      name: "kind",
      type: "select",
      required: true,
      options: ["stage-change", "assignment", "note", "task", "notification"],
    },
    { name: "message", type: "text", required: true },
    // Null for system entries (e.g. the new-lead notification send).
    { name: "actor", type: "relationship", relationTo: "users" },
  ],
  timestamps: true,
};
