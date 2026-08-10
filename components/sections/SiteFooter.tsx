import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/primitives/Logo";
import { SITE } from "@/lib/site";

const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/disclaimer", label: "Disclaimer" },
  { href: "/legal/cookies", label: "Cookies" },
] as const;

export function SiteFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-midnight text-sand">
      <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-12 md:px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <Logo reversed className="-m-2" />
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="type-micro uppercase text-sand/60 transition-colors duration-fast ease-brand hover:text-sand"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* §11 — compliance strip. ORN / licence numbers are placeholders until Q3 is answered. */}
        <div className="flex flex-col gap-3 border-t border-sand/15 pt-8">
          <p className="type-micro text-sand/60">
            {SITE.compliance.legalName} · {SITE.compliance.orn} ·{" "}
            {SITE.compliance.tradeLicence} · {SITE.compliance.city}
          </p>
          <p className="type-micro text-sand/60">{t("escrow")}</p>
          <p className="type-micro text-sand/60">{t("investment")}</p>
          <p className="type-micro text-sand/60">{t("mortgage")}</p>
          <p className="type-micro text-sand/40">{t("rights", { year })}</p>
        </div>
      </div>
    </footer>
  );
}
