import type { CollectionConfig } from "payload";
import { fixtureField, hideFixtures } from "./shared";

export const Developers: CollectionConfig = {
  slug: "developers",
  admin: { useAsTitle: "name", defaultColumns: ["name", "alcazarPanelStatus"] },
  access: { read: () => true },
  hooks: { beforeOperation: [hideFixtures] },
  fields: [
    fixtureField,
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "name", type: "text", required: true },
    { name: "logo", type: "upload", relationTo: "media" },
    { name: "foundedYear", type: "number" },
    { name: "headquarters", type: "text" },
    { name: "completedUnits", type: "number" },
    { name: "projectsDelivered", type: "number" },
    {
      name: "averageHandoverSlippageMonths",
      type: "number",
      admin: {
        description:
          "Across delivered projects. Source it — this renders publicly on the track record card.",
      },
    },
    { name: "deliveryTrackRecord", type: "richText" },
    {
      name: "alcazarPanelStatus",
      type: "select",
      required: true,
      defaultValue: "not-on-panel",
      options: ["active", "selective", "not-on-panel"],
    },
  ],
};
