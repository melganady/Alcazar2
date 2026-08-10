import type { CollectionConfig } from "payload";
import { EMIRATES } from "./shared";

export const Communities: CollectionConfig = {
  slug: "communities",
  admin: { useAsTitle: "name", defaultColumns: ["name", "emirate"] },
  access: { read: () => true },
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "name", type: "text", required: true },
    { name: "emirate", type: "select", required: true, options: EMIRATES },
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
