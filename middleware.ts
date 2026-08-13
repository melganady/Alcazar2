import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip Payload admin + API, the Alcázar CRM, OG image generation, Next
  // internals, and any file with an extension (sitemap.xml, robots.txt,
  // static assets). /crm has its own auth gate and root layout — it must
  // never be rewritten to /en/crm or /ar/crm by the locale middleware.
  matcher: ["/((?!api|admin|crm|og|_next|_vercel|.*\\..*).*)"],
};
