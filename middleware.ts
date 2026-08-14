import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip Payload admin + API, OG image generation, Next internals, and any
  // file with an extension (sitemap.xml, robots.txt, static assets).
  matcher: ["/((?!api|admin|og|_next|_vercel|.*\\..*).*)"],
};
