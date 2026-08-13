import type { Metadata } from "next";
import { jost, montserrat } from "@/lib/fonts";
import { ToastProvider } from "@/components/primitives/Toast";
import { cn } from "@/lib/cn";
import "../globals.css";

/*
 * Alcázar CRM — its own root layout, parallel to app/[locale] (the public
 * site) and app/(payload) (the Payload admin). English-only: this is an
 * internal tool for the Alcázar team, not a locale-routed public page.
 *
 * noindex belongs here too, not just robots.ts — a defence-in-depth pair,
 * same pattern as /admin.
 */
export const metadata: Metadata = {
  title: { default: "Alcázar CRM", template: "%s · Alcázar CRM" },
  robots: { index: false, follow: false },
};

export default function CrmRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(jost.variable, montserrat.variable)}>
      <body className="bg-frost text-iron">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
