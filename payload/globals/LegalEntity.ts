import type { GlobalConfig } from "payload";

/**
 * The regulated identity behind the brand (§11.3).
 *
 * Alcázar is the brand. The entity that actually holds the brokerage licence
 * is what DLD registers, what Trakheesi permits are issued against, and what
 * an ORN resolves to in the public register. Those are separate things, so the
 * site models them separately: `brand` appears everywhere, `licensedEntity`
 * appears only in the compliance strip, and the numbers below belong to the
 * licence holder whether or not that is the same company as the brand.
 *
 * Editable here rather than hardcoded so the numbers can be corrected without
 * a deploy, and so a trade-name registration can change the displayed line
 * without touching any component.
 */
export const LegalEntity: GlobalConfig = {
  slug: "legal-entity",
  label: "Legal entity & licence",
  access: { read: () => true },
  admin: {
    description:
      "Appears in the footer of every page and on every property advert. An ORN is publicly searchable in the DLD register, so whatever is entered here is discoverable regardless of how it is displayed.",
  },
  fields: [
    {
      name: "brandName",
      type: "text",
      required: true,
      defaultValue: "Alcázar",
      admin: { description: "The consumer-facing brand. Used everywhere on the site." },
    },
    {
      name: "licensedEntityName",
      type: "text",
      admin: {
        description:
          "The company that holds the brokerage licence. Required on adverts under RERA rules — see displayMode.",
      },
    },
    {
      name: "displayMode",
      type: "select",
      required: true,
      defaultValue: "brand-with-licence-line",
      options: [
        {
          label: "Brand, with the licensed entity named in the compliance strip (recommended)",
          value: "brand-with-licence-line",
        },
        {
          label: "Brand only — licence numbers shown without naming the entity",
          value: "brand-only",
        },
      ],
      admin: {
        description:
          "Brand-only omits the licence holder's name. The ORN still resolves to it publicly, and RERA advertising rules expect the broker to be identified — take legal advice before using it.",
      },
    },
    {
      type: "row",
      fields: [
        { name: "orn", type: "text", admin: { description: "RERA Office Registration Number" } },
        { name: "tradeLicence", type: "text", admin: { description: "DED trade licence number" } },
      ],
    },
    { name: "dldBrokerRegistration", type: "text" },
    {
      type: "row",
      fields: [
        {
          name: "tradeLicenceExpiry",
          type: "date",
          admin: {
            description:
              "An expired licence is not published. The site shows 'pending' rather than a number that is no longer valid.",
          },
        },
        { name: "commercialRegister", type: "text" },
        { name: "chamberMembership", type: "text" },
      ],
    },
    {
      name: "address",
      type: "textarea",
      admin: { description: "The registered office address shown on the site." },
    },
    { name: "city", type: "text", defaultValue: "Dubai, United Arab Emirates" },
    {
      type: "row",
      fields: [
        { name: "phone", type: "text" },
        { name: "email", type: "email" },
      ],
    },
  ],
};
