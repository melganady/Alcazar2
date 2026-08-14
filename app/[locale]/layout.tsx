import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { barlow, barlowCondensed, plexArabic } from "@/lib/fonts";
import { PrefsProvider } from "@/components/primitives/PrefsProvider";
import { ToastProvider } from "@/components/primitives/Toast";
import { SiteHeader } from "@/components/sections/SiteHeader";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { FloatingContact } from "@/components/sections/FloatingContact";
import { getComplianceIdentity } from "@/lib/legalEntity";
import { whatsappHref } from "@/lib/credentials";
import { CookieConsent } from "@/components/primitives/CookieConsent";
import { organizationJsonLd, BASE_URL } from "@/lib/seo";
import { cn } from "@/lib/cn";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "REIN Investment — Fresh thinking, real income",
    template: "%s | REIN Investment",
  },
  description:
    "A private real estate desk placing capital across seven markets. Pre-construction, income-producing and fix-and-flip assets, underwritten to one standard, with financing arranged alongside.",
  openGraph: {
    siteName: "REIN Investment",
    type: "website",
    locale: "en_AE",
    alternateLocale: "ar_AE",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const isAr = locale === "ar";
  const identity = await getComplianceIdentity();
  const t = await getTranslations("nav");

  return (
    <html
      lang={locale}
      dir={isAr ? "rtl" : "ltr"}
      className={cn(
        barlowCondensed.variable,
        barlow.variable,
        isAr && plexArabic.variable,
      )}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <NextIntlClientProvider>
          <PrefsProvider>
            <ToastProvider>
              <a
                href="#main"
                className="type-eyebrow sr-only bg-navy px-4 py-2 text-chalk focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50"
              >
                Skip to content
              </a>
              <SiteHeader />
              <main id="main">{children}</main>
              <SiteFooter />
              <FloatingContact
                phone={identity.phone}
                waHref={whatsappHref(identity.whatsapp)}
                callLabel={t("call")}
                whatsappLabel={t("whatsapp")}
              />
              <CookieConsent />
            </ToastProvider>
          </PrefsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
