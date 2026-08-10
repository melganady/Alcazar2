import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "as-needed", // clean English URLs; /ar/... for Arabic
});

export type Locale = (typeof routing.locales)[number];
