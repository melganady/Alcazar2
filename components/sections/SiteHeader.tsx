import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/primitives/Logo";
import {
  CurrencySwitcher,
  UnitSwitcher,
  LocaleSwitcher,
} from "@/components/primitives/Switchers";
import { MobileNav } from "./MobileNav";

const NAV_KEYS: ReadonlyArray<{ key: string; href: string; soon?: boolean }> = [
  { key: "projects", href: "/projects" },
  { key: "secondary", href: "/secondary", soon: true },
  { key: "developers", href: "/developers" },
  { key: "communities", href: "/communities" },
  { key: "mortgages", href: "/mortgages" },
  { key: "howWeWork", href: "/how-we-work" },
  { key: "insights", href: "/insights" },
  { key: "careers", href: "/careers" },
];

export function SiteHeader() {
  const t = useTranslations("nav");
  const tBrand = useTranslations("brand");
  const links = NAV_KEYS.map(({ key, href, soon }) => ({ href, label: t(key), soon }));

  return (
    <header className="border-b border-rule bg-frost">
      {/* Utility bar: locale, currency, units (§9) */}
      <div className="border-b border-rule">
        <div className="mx-auto flex max-w-container items-center justify-between gap-4 px-4 py-1.5 md:px-6">
          <p className="type-micro hidden text-iron/80 sm:block">
            {tBrand("tagline")}
          </p>
          <div className="flex items-center gap-5">
            <LocaleSwitcher />
            <CurrencySwitcher />
            <UnitSwitcher />
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="mx-auto flex max-w-container items-center justify-between gap-6 px-4 py-3 md:px-6">
        <Link href="/" className="-m-2 shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="type-eyebrow text-iron/80 transition-colors duration-fast ease-brand hover:text-iron hover:underline hover:underline-offset-4"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="type-eyebrow border border-iron px-4 py-2.5 text-iron transition-colors duration-fast ease-brand hover:bg-iron hover:text-ash"
          >
            {t("enquire")}
          </Link>
        </nav>
        <MobileNav
          links={[...links, { href: "/contact", label: t("contact") }]}
          menuLabel={t("menu")}
          closeLabel={t("close")}
        />
      </div>
    </header>
  );
}
