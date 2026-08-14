import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/primitives/Logo";
import { getComplianceIdentity } from "@/lib/legalEntity";
import { whatsappHref } from "@/lib/credentials";
import { WhatsAppLink } from "@/components/analytics/WhatsAppLink";

const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/disclaimer", label: "Disclaimer" },
  { href: "/legal/cookies", label: "Cookies" },
] as const;

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const identity = await getComplianceIdentity();
  const waHref = whatsappHref(identity.whatsapp);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-chalk">
      <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-12 md:px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="flex flex-col gap-4">
            <Logo reversed className="-m-2" />
            {/* Reachable from any page, rather than only from /contact. */}
            <address className="type-body-s not-italic text-chalk/80">
              {identity.address ? (
                <span className="block whitespace-pre-line">{identity.address}</span>
              ) : null}
              <span className="block">{identity.city}</span>
              <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                {identity.phone ? (
                  <a
                    href={`tel:${identity.phone.replace(/\s/g, "")}`}
                    className="text-chalk underline-offset-4 hover:underline"
                  >
                    {identity.phone}
                  </a>
                ) : null}
                {waHref ? (
                  <WhatsAppLink
                    href={waHref}
                    source="footer"
                    className="bg-transparent p-0 text-chalk underline-offset-4 hover:bg-transparent hover:underline"
                  >
                    WhatsApp
                  </WhatsAppLink>
                ) : null}
                {identity.email ? (
                  <a
                    href={`mailto:${identity.email}`}
                    className="text-chalk underline-offset-4 hover:underline"
                  >
                    {identity.email}
                  </a>
                ) : null}
              </span>
            </address>
          </div>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="type-micro uppercase text-chalk/80 transition-colors duration-fast ease-brand hover:text-chalk"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* §11 — compliance strip. ORN / licence numbers are placeholders until Q3 is answered. */}
        <div className="flex flex-col gap-3 border-t border-chalk/15 pt-8">
          <p className="type-micro text-chalk/80">
            {[identity.licenceLine, ...identity.registrations, identity.city]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="type-micro text-chalk/80">{t("escrow")}</p>
          <p className="type-micro text-chalk/80">{t("investment")}</p>
          <p className="type-micro text-chalk/80">{t("mortgage")}</p>
          <p className="type-micro text-chalk/80">{t("rights", { year })}</p>
        </div>
      </div>
    </footer>
  );
}
