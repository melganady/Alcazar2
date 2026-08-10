import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    staticDir: "media",
    mimeTypes: ["image/*", "application/pdf"],
  },
  access: { read: () => true },
  fields: [
    { name: "alt", type: "text", required: true },
    {
      name: "credit",
      type: "text",
      admin: {
        description:
          "Shown in gallery caption strips, e.g. 'Render: developer name'.",
      },
    },
  ],
};
