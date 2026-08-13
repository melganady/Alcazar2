import type { CollectionConfig } from "payload";
import { adminOnly } from "./crmShared";

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
 *
 * Access, tightened alongside the CRM build: this collection had no explicit
 * access control before (Payload's open default), which meant anyone could
 * list every team member's name and email over the public API, and anyone
 * could self-register a new `users` account — which also doubles as an
 * /admin login. Both close here: reads require a session, and only an
 * admin can create a user (matches "only admins manage team members").
 * A person can still update their own name; only an admin can edit someone
 * else's record, and the `role` field itself stays admin-only either way.
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email", defaultColumns: ["email", "name", "role"] },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: adminOnly,
    update: ({ req }) => {
      if (!req.user) return false;
      if (req.user.role === "admin") return true;
      return { id: { equals: req.user.id } };
    },
    delete: adminOnly,
  },
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
