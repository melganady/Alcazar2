import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { CropMarks } from "@/components/primitives/CropMarks";
import { Field } from "@/components/primitives/Field";
import { SentBanner } from "@/components/project/SentBanner";
import { getPayloadClient } from "@/lib/payload";
import { createLead } from "@/lib/actions";
import { alternates } from "@/lib/seo";
import { SECONDARY, VERBATIM } from "@/lib/content";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "secondary" });
  return {
    title: `${t("title")} — ${t("badge")}`,
    description: t("support"),
    alternates: alternates("/secondary"),
  };
}

export default async function SecondaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("secondary");

  const payload = await getPayloadClient();
  const agents = await payload.find({ collection: "agents", limit: 1, sort: "slug" });
  const agent = agents.docs[0];

  return (
    <div className="flex flex-col">
      {/* Header — the coming-soon status is stated up front, not buried */}
      <section className="mx-auto flex max-w-container flex-col items-start gap-6 px-4 py-20 md:px-6 md:py-24">
        <div className="flex flex-wrap items-center gap-4">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <span className="type-micro border border-pine bg-pine/18 px-3 py-1 uppercase tracking-eyebrow text-iron">
            {t("badge")}
          </span>
        </div>
        <h1 className="type-display-xl max-w-3xl text-iron">{t("title")}</h1>
        <p className="type-body-l max-w-2xl text-iron/80">{t("support")}</p>
      </section>

      {/* How resale differs */}
      <section className="border-t border-rule bg-pine/8">
        <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
          <h2 className="type-display-m max-w-3xl text-iron">{t("differsTitle")}</h2>
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {SECONDARY.differences.map((d, i) => (
              <div key={d.title} className="flex flex-col gap-2 border-t-2 border-pine pt-4">
                <span aria-hidden className="type-micro text-pine">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="type-display-s text-iron">{d.title}</h3>
                <p className="type-body-s text-iron/80">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Markets */}
      <section className="border-t border-rule">
        <div className="mx-auto flex max-w-container flex-col gap-8 px-4 py-16 md:px-6">
          <div className="flex flex-col gap-3">
            <h2 className="type-display-m text-iron">{t("marketsTitle")}</h2>
            <p className="type-body-l max-w-2xl text-iron/80">{t("marketsSupport")}</p>
          </div>
          <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {SECONDARY.markets.map((m) => (
              <li key={m.key} className="flex flex-col gap-1 border-t border-rule pt-4">
                <span className="type-display-s text-iron">{m.name}</span>
                <span className="type-body-s text-iron/80">{m.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Same method */}
      <section className="border-t border-rule">
        <div className="mx-auto flex max-w-container flex-col gap-4 px-4 py-16 md:px-6">
          <h2 className="type-display-m max-w-3xl text-iron">{t("filterTitle")}</h2>
          <p className="type-body-l max-w-3xl text-iron/80">{t("filterBody")}</p>
          <p className="type-display-s mt-2 max-w-2xl text-iron">{VERBATIM.theTest}</p>
        </div>
      </section>

      {/* Register interest — the point of a coming-soon page */}
      <section className="border-t border-rule">
        <div className="mx-auto px-4 py-16 md:px-6">
          <CropMarks className="mx-auto max-w-container">
            <div className="flex flex-col gap-6 bg-pine/18 p-8">
              <div className="flex flex-col gap-2">
                <h2 className="type-display-m text-iron">{t("registerTitle")}</h2>
                <p className="type-body max-w-2xl text-iron/80">{t("registerBody")}</p>
              </div>

              <Suspense fallback={null}>
                <SentBanner consultant={agent?.name ?? "A consultant"} />
              </Suspense>

              <form action={createLead} className="grid max-w-3xl gap-4 sm:grid-cols-2">
                <input
                  type="hidden"
                  name="returnTo"
                  value={`/${locale === "en" ? "" : `${locale}/`}secondary`.replace("//", "/")}
                />
                <input type="hidden" name="sourcePage" value="/secondary" />
                <input type="hidden" name="locale" value={locale} />
                <div className="hidden" aria-hidden>
                  <input type="text" name="company" tabIndex={-1} autoComplete="off" />
                </div>

                <Field id="sec-name" name="name" label="Full name" required />
                <Field id="sec-email" name="email" type="email" label="Email" required />

                <fieldset className="sm:col-span-2">
                  <legend className="type-body-s mb-3 font-medium text-iron">
                    {t("marketsLabel")}
                  </legend>
                  <div className="grid gap-x-8 gap-y-2 sm:grid-cols-3">
                    {SECONDARY.markets.map((m) => (
                      <label
                        key={m.key}
                        className="type-body-s flex items-center gap-2 text-iron"
                      >
                        <input
                          type="checkbox"
                          name="markets"
                          value={m.name}
                          className="h-4 w-4 accent-[var(--pine-smoke)]"
                        />
                        {m.name}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="type-body-s flex items-start gap-2 text-iron sm:col-span-2">
                  <input
                    type="checkbox"
                    name="marketingConsent"
                    className="mt-1 h-4 w-4 accent-[var(--pine-smoke)]"
                  />
                  You may email me when a desk opens in these markets.
                </label>

                <button
                  type="submit"
                  className="type-eyebrow bg-iron px-6 py-3.5 text-ash transition-colors duration-fast ease-brand hover:bg-iron/85 sm:col-span-2 sm:justify-self-start"
                >
                  {t("submit")}
                </button>
              </form>

              {/* Stated plainly: nothing here is a property advert. */}
              <p className="type-micro max-w-2xl text-iron/80">{t("note")}</p>
            </div>
          </CropMarks>
        </div>
      </section>
    </div>
  );
}
