import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/primitives/Eyebrow";

/*
 * Placeholder home — the full §6 home ships in Phase 5.
 * Blue-rule check: this composition's one blue element is the headline.
 */
export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <section className="mx-auto flex max-w-container flex-col items-start gap-8 px-4 py-24 md:px-6 md:py-36">
      <Eyebrow>{t("eyebrow")}</Eyebrow>
      <h1 className="type-display-xl max-w-4xl text-blue">{t("title")}</h1>
      <p className="type-body-l max-w-xl text-midnight/80">{t("support")}</p>
      <div className="flex flex-wrap gap-4">
        <Link
          href="/projects"
          className="type-eyebrow bg-blue px-6 py-3.5 text-sand transition-colors duration-fast ease-brand hover:bg-midnight"
        >
          {t("ctaShortlist")}
        </Link>
        <Link
          href="/mortgages/calculator"
          className="type-eyebrow border border-blue px-6 py-3.5 text-blue transition-colors duration-fast ease-brand hover:bg-blue hover:text-sand"
        >
          {t("ctaBorrow")}
        </Link>
      </div>
    </section>
  );
}
