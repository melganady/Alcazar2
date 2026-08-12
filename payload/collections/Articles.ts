import type { CollectionConfig } from "payload";
import { fixtureField, hideFixtures } from "./shared";

export const Articles: CollectionConfig = {
  slug: "articles",
  admin: { useAsTitle: "title", defaultColumns: ["title", "category", "publishedAt"] },
  access: { read: () => true },
  hooks: { beforeOperation: [hideFixtures] },
  fields: [
    fixtureField,
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "title", type: "text", required: true },
    {
      name: "category",
      type: "select",
      required: true,
      options: ["market", "mortgage", "community", "developer", "guide"],
    },
    { name: "excerpt", type: "textarea" },
    { name: "body", type: "richText" },
    { name: "author", type: "relationship", relationTo: "agents" },
    { name: "publishedAt", type: "date" },
    { name: "updatedAt2", label: "Content updated at", type: "date" },
    { name: "relatedProjects", type: "relationship", relationTo: "projects", hasMany: true },
    { name: "relatedCommunities", type: "relationship", relationTo: "communities", hasMany: true },
    {
      name: "faq",
      type: "array",
      admin: { description: "Rendered with FAQPage schema markup (§10)." },
      fields: [
        { name: "q", type: "text", required: true },
        { name: "a", type: "textarea", required: true },
      ],
    },
  ],
};
