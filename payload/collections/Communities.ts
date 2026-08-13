import type { CollectionConfig } from "payload";
import { COUNTRY_OPTIONS, REGION_OPTIONS } from "./markets";
import { fixtureField, hideFixtures } from "./shared";
import { revalidateDirectoryEntry, revalidateDirectoryEntryOnDelete } from "../hooks/revalidate";

export const Communities: CollectionConfig = {
  slug: "communities",
  admin: { useAsTitle: "name", defaultColumns: ["name", "region", "country"] },
  access: { read: () => true },
  hooks: {
    beforeOperation: [hideFixtures],
    afterChange: [revalidateDirectoryEntry("communities")],
    afterDelete: [revalidateDirectoryEntryOnDelete("communities")],
  },
  fields: [
    fixtureField,
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "name", type: "text", required: true },
    { name: "country", type: "select", required: true, options: COUNTRY_OPTIONS, defaultValue: "AE" },
    { name: "region", type: "select", required: true, options: REGION_OPTIONS, defaultValue: "Dubai" },
    { name: "description", type: "richText" },
    {
      type: "row",
      fields: [
        { name: "lat", type: "number" },
        { name: "lng", type: "number" },
      ],
    },
    { name: "avgPricePerSqft", type: "number" },
    { name: "avgRentalYieldPct", type: "number" },
    { name: "transportNotes", type: "textarea" },
    { name: "schoolsNotes", type: "textarea" },
    { name: "heroImage", type: "upload", relationTo: "media" },
  ],
};
