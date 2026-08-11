import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { Field } from "@/components/primitives/Field";
import { Select } from "@/components/primitives/Select";
import { SentBanner } from "@/components/project/SentBanner";
import { getPayloadClient } from "@/lib/payload";
import { createLead } from "@/lib/actions";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach an Alcázar consultant on WhatsApp or by form. Offices in Dubai. Residency status first — it changes what we show you.",
};

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("project");

  const payload = await getPayloadClient();
  const agents = await payload.find({ collection: "agents", limit: 3, sort: "slug" });
  const agent = agents.docs[0];

  const waHref = agent?.whatsapp
    ? `https://wa.me/${agent.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent("Enquiry from alcazar.ae")}`
    : null;

  return (
    <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-12 md:px-6">
      <header className="flex flex-col gap-3">
        <Eyebrow>Alcázar · Contact</Eyebrow>
        <h1 className="type-display-l text-blue">Start with a brief</h1>
        <p className="type-body-l max-w-2xl text-midnight/80">
          Twenty minutes, no deck. Tell us the budget, the residency status and
          the exit horizon — the rest follows from those three.
        </p>
      </header>

      <div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
        <aside className="flex flex-col gap-6">
          {agent ? (
            <div className="flex flex-col gap-1 border border-rule bg-white p-5">
              <p className="type-micro uppercase text-midnight/50">{t("consultant")}</p>
              <p className="type-display-s text-midnight">{agent.name}</p>
              <p className="type-body-s text-midnight/70">{agent.role}</p>
              <p className="type-micro text-midnight/50">RERA BRN {agent.brn}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {waHref ? (
                  <a
                    href={waHref}
                    className="type-eyebrow bg-blue px-4 py-2.5 text-sand transition-colors duration-fast ease-brand hover:bg-midnight"
                  >
                    WhatsApp
                  </a>
                ) : null}
                {agent.email ? (
                  <a
                    href={`mailto:${agent.email}`}
                    className="type-eyebrow border border-blue px-4 py-2.5 text-blue transition-colors duration-fast ease-brand hover:bg-blue hover:text-sand"
                  >
                    Email
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 border border-rule bg-white p-5">
            <p className="type-micro uppercase text-midnight/50">Office</p>
            <p className="type-body-s text-midnight">{SITE.compliance.legalName}</p>
            <p className="type-body-s text-midnight/70">{SITE.compliance.city}</p>
            <p className="type-micro mt-2 text-midnight/50">
              {SITE.compliance.orn} · {SITE.compliance.tradeLicence}
            </p>
          </div>
        </aside>

        <div className="flex flex-col gap-6">
          <Suspense fallback={null}>
            <SentBanner consultant={agent?.name ?? "Alcázar"} />
          </Suspense>

          <form action={createLead} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="returnTo" value={`/${locale === "en" ? "" : `${locale}/`}contact`.replace("//", "/")} />
            <input type="hidden" name="sourcePage" value="/contact" />
            <input type="hidden" name="locale" value={locale} />
            <div className="hidden" aria-hidden>
              <input type="text" name="company" tabIndex={-1} autoComplete="off" />
            </div>

            {/* Residency first — it changes what we show next (§13) */}
            <Select
              id="contact-residency"
              name="residencyStatus"
              label={t("formResidency")}
              options={[
                { value: "non-resident", label: t("residencyNonResident") },
                { value: "uae-resident", label: t("residencyResident") },
                { value: "uae-national", label: t("residencyNational") },
              ]}
            />
            <Field id="contact-budget" name="budgetBandAED" label={t("formBudget")} />
            <Field id="contact-name" name="name" label={t("formName")} required />
            <Field id="contact-email" name="email" type="email" label={t("formEmail")} />
            <Field id="contact-phone" name="phone" type="tel" label={t("formPhone")} />
            <Select
              id="contact-purpose"
              name="purpose"
              label={t("formPurpose")}
              options={[
                { value: "investment", label: t("purposeInvestment") },
                { value: "end-use", label: t("purposeEndUse") },
                { value: "both", label: t("purposeBoth") },
              ]}
            />
            <div className="sm:col-span-2">
              <Field id="contact-message" name="message" label={t("formMessage")} />
            </div>

            {/* PDPL — granular, separate, unticked (§11.7) */}
            <label className="type-body-s flex items-start gap-2 text-midnight">
              <input type="checkbox" name="financeNeeded" className="mt-1 h-4 w-4 accent-[var(--alcazar-blue)]" />
              {t("formFinance")}
            </label>
            <label className="type-body-s flex items-start gap-2 text-midnight">
              <input type="checkbox" name="whatsappConsent" className="mt-1 h-4 w-4 accent-[var(--alcazar-blue)]" />
              {t("formWhatsappConsent")}
            </label>
            <label className="type-body-s flex items-start gap-2 text-midnight sm:col-span-2">
              <input type="checkbox" name="marketingConsent" className="mt-1 h-4 w-4 accent-[var(--alcazar-blue)]" />
              Send me occasional market notes. Separate from the reply to this enquiry.
            </label>

            <button
              type="submit"
              className="type-eyebrow bg-blue px-6 py-3.5 text-sand transition-colors duration-fast ease-brand hover:bg-midnight sm:col-span-2 sm:justify-self-start"
            >
              {t("formSubmit")}
            </button>
          </form>

          <p className="type-micro max-w-2xl text-midnight/50">
            We process your details to respond to this enquiry, under our privacy
            policy. Marketing and WhatsApp consent are separate and optional, and
            you can ask us to delete your data at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
