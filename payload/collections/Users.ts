import type { CollectionConfig } from "payload";

/**
 * Alcázar CRM team accounts. Same login as /admin — the CRM at /crm reuses
 * this collection's auth rather than standing up a second one. `role` is
 * what gates the CRM: admins manage listings, developers, communities and
 * the team; agents work their assigned leads. Only an admin may change a
 * role, so an agent can never promote themselves.
 *
 * Existing users predate this field and read as `null` until set — see the
 * CRM README for the one-time step of opening each existing user in /admin
 * and setting their role after this ships.
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email", defaultColumns: ["email", "name", "role"] },
  fields: [
    { name: "name", type: "text" },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "agent",
      options: [
        { label: "Admin — full access, manages listings & team", value: "admin" },
        { label: "Agent — works assigned leads only", value: "agent" },
      ],
      access: {
        // A non-admin saving their own profile can't grant themselves admin.
        update: ({ req }) => req.user?.role === "admin",
      },
      admin: { position: "sidebar" },
    },
  ],
};
