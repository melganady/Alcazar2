import type { CollectionConfig } from "payload";

export const Agents: CollectionConfig = {
  slug: "agents",
  admin: { useAsTitle: "name", defaultColumns: ["name", "role", "brn"] },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "name", type: "text", required: true },
    { name: "role", type: "text", required: true },
    {
      name: "brn",
      type: "text",
      required: true,
      admin: {
        description:
          "RERA broker number — §11.2, renders on the profile and every attributed listing.",
      },
    },
    {
      name: "brnExpiry",
      type: "date",
      admin: {
        description:
          "§11.2 — a lapsed broker card must not be published against a listing. Expired BRNs are suppressed on the site.",
      },
    },
    { name: "languages", type: "text", hasMany: true },
    { name: "specialisms", type: "text", hasMany: true },
    { name: "photo", type: "upload", relationTo: "media" },
    { name: "bio", type: "textarea" },
    { name: "whatsapp", type: "text", admin: { description: "E.164, e.g. +9715..." } },
    { name: "email", type: "email" },
    { name: "calendlyUrl", type: "text" },
  ],
};
