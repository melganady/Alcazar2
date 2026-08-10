import type { CollectionConfig } from "payload";

export const Leads: CollectionConfig = {
  slug: "leads",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "residencyStatus", "budgetBandAED", "createdAt"],
    description: "PDPL: lawful basis is captured per submission; deletion requests are honoured here.",
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
