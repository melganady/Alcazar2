import type { CollectionConfig } from "payload";
import { getCrmAdapter } from "@/lib/crm";
import { autoresponderHtml, getEmailAdapter } from "@/lib/email";

export const Leads: CollectionConfig = {
  slug: "leads",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "residencyStatus", "budgetBandAED", "createdAt"],
    description: "PDPL: lawful basis is captured per submission; deletion requests are honoured here.",
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== "create") return;

        // §13 — CRM push. Failure never blocks the lead; it stays visible
        // in the admin with crmSyncedAt empty for manual retry.
        try {
          const crm = getCrmAdapter();
          const result = await crm.pushLead(doc);
          if (result.ok) {
            await req.payload.update({
              collection: "leads",
              id: doc.id,
              data: { crmSyncedAt: new Date().toISOString() },
            });
          } else {
            req.payload.logger.error(`CRM push failed (${crm.name}): ${result.error}`);
          }
        } catch (err) {
          req.payload.logger.error(`CRM push threw: ${String(err)}`);
        }

        // §13 — autoresponder from a named consultant with a real reply-to.
        try {
          if (doc.email) {
            const agents = await req.payload.find({
              collection: "agents",
              limit: 1,
              sort: "slug",
            });
            const agent = agents.docs[0];
            if (agent) {
              const isCareer = doc.message?.startsWith("Career application");
              const email = getEmailAdapter();
              const result = await email.send({
                to: doc.email,
                subject: isCareer
                  ? "Your application — REIN Investment"
                  : "Your enquiry — REIN Investment",
                replyTo: agent.email ?? undefined,
                html: autoresponderHtml({
                  leadName: doc.name,
                  consultantName: agent.name,
                  consultantRole: agent.role,
                  nextStep: isCareer
                    ? "I review every application myself. If the video lands, we talk this week."
                    : "I will come back within one working day with availability, the payment plan against your budget, and the financing route that fits your residency status.",
                }),
              });
              if (!result.ok) {
                req.payload.logger.error(`Autoresponder failed: ${result.error}`);
              }
            }
          }
        } catch (err) {
          req.payload.logger.error(`Autoresponder threw: ${String(err)}`);
        }
      },
    ],
  },
  access: {
    // Created via server actions only; readable by staff only
    read: ({ req }) => Boolean(req.user),
    create: () => true,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email" },
    { name: "phone", type: "text" },
    { name: "whatsappConsent", type: "checkbox", defaultValue: false },
    { name: "marketingConsent", type: "checkbox", defaultValue: false },
    {
      name: "residencyStatus",
      type: "select",
      options: ["uae-resident", "non-resident", "uae-national"],
    },
    { name: "budgetBandAED", type: "text" },
    { name: "purpose", type: "select", options: ["investment", "end-use", "both"] },
    { name: "financeNeeded", type: "checkbox" },
    { name: "sourceProject", type: "relationship", relationTo: "projects" },
    { name: "sourcePage", type: "text" },
    { name: "utm", type: "json" },
    { name: "locale", type: "text" },
    { name: "currency", type: "text" },
    { name: "message", type: "textarea" },
    { name: "crmSyncedAt", type: "date" },
  ],
};
