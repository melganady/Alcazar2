import type { CollectionConfig } from "payload";
import { adminOnly, staffOnly } from "./crmShared";

/**
 * Follow-up tasks against a lead — what "My Tasks" in /crm is built from.
 * Creation and done/not-done toggles both drop an activity-feed entry.
 * Same v1 access note as LeadNotes: staff-wide read/update, strict
 * boundary lives on the parent Lead.
 */
export const LeadTasks: CollectionConfig = {
  slug: "lead-tasks",
  labels: { singular: "Lead task", plural: "Lead tasks" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "lead", "assignedTo", "dueDate", "done"],
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
      async ({ doc, previousDoc, operation, req }) => {
        try {
          if (operation === "create") {
            await req.payload.create({
              collection: "lead-activity",
              data: {
                lead: doc.lead,
                kind: "task",
                message: `Task created: "${doc.title}"${doc.dueDate ? ` (due ${String(doc.dueDate).slice(0, 10)})` : ""}`,
                actor: req.user?.id,
              },
            });
          } else if (previousDoc && previousDoc.done !== doc.done) {
            await req.payload.create({
              collection: "lead-activity",
              data: {
                lead: doc.lead,
                kind: "task",
                message: doc.done
                  ? `Task completed: "${doc.title}"`
                  : `Task reopened: "${doc.title}"`,
                actor: req.user?.id,
              },
            });
          }
        } catch (err) {
          req.payload.logger.error(`lead-activity write failed (task): ${String(err)}`);
        }
      },
    ],
  },
  fields: [
    { name: "lead", type: "relationship", relationTo: "leads", required: true, index: true },
    { name: "title", type: "text", required: true },
    { name: "dueDate", type: "date" },
    { name: "reminderAt", type: "date", admin: { description: "Optional — a time to be nudged before dueDate." } },
    { name: "assignedTo", type: "relationship", relationTo: "users", required: true },
    { name: "done", type: "checkbox", defaultValue: false, index: true },
  ],
  timestamps: true,
};
