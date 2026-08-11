import type { Metadata } from "next";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { Field } from "@/components/primitives/Field";
import { CropMarks } from "@/components/primitives/CropMarks";
import { SentBanner } from "@/components/project/SentBanner";
import { createLead } from "@/lib/actions";
import { VERBATIM } from "@/lib/content";

export const metadata: Metadata = {
  title: "Careers — young, not casual",
  description:
    "Alcázar hires brokers, not CVs. The academy, the split, the progression tiers, and a 60-second video instead of a résumé.",
};

const ACADEMY = [
  ["Weeks 1–2", "Product. Every project on the shortlist, every payment plan, every developer's delivery record. You are tested on it."],
  ["Weeks 3–4", "Financing. LTV caps, DBR maths, non-resident routes. You will out-know most bankers by the end of it."],
  ["Weeks 5–8", "Floor. Live enquiries with a senior on the call, then live enquiries without one."],
] as const;

const TIERS = [
  ["Associate", "50%", "Ramp. House leads, house support, full training."],
  ["Consultant", "60%", "Your own pipeline. Named on project pages."],
  ["Senior Consultant", "70%", "Developer relationships, allocation conversations."],
  ["Partner", "Negotiated", "You build a desk. Others ramp under you."],
] as const;

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col">
      {/* Blue field hero — the one place the brand is loudest. Headline is sand. */}
      <section className="bg-blue">
        <div className="mx-auto flex max-w-container flex-col items-start gap-6 px-4 py-24 md:px-6 md:py-32">
          <p className="type-eyebrow text-sand/80">Alcázar · Careers</p>
          <h1 className="type-display-xl max-w-3xl text-sand">{VERBATIM.careersHeadline}</h1>
          <p className="type-body-l max-w-xl text-sand/80">
            We sell buildings that do not exist yet, to people who have never met
            us, in a market that moves weekly. That takes a specific kind of
            person. It does not take a real estate CV.
          </p>
          <a
            href="#apply"
            className="type-eyebrow bg-sand px-6 py-3.5 text-blue transition-colors duration-fast ease-brand hover:bg-white"
          >
            Apply in 60 seconds
          </a>
        </div>
      </section>

      <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-16 md:px-6">
        <section className="grid gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="type-display-m text-midnight">What the job actually is</h2>
            <p className="type-body text-midnight/80">
              You talk to people in London, Mumbai, Lagos and Moscow who are about
              to move seven figures into a building that is a render today. Your
              job is to be the reason they trust it — with numbers, not adjectives.
            </p>
            <p className="type-body text-midnight/80">
              You will know the payment plan, the handover quarter, the developer&rsquo;s
              slippage record and the buyer&rsquo;s borrowing ceiling before you pick up.
              That is the standard on day one.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="type-display-m text-midnight">What we do not want</h2>
            <ul className="flex flex-col divide-y divide-rule border border-rule bg-white">
              {[
                "Anyone who opens with \"luxury lifestyle\"",
                "Portal-dump habits — sending 40 listings and calling it service",
                "Promises about handover dates nobody can keep",
                "Reading a script when the client asked a real question",
              ].map((x) => (
                <li key={x} className="type-body-s p-3 text-midnight/80">
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="type-display-m text-midnight">The academy — eight weeks</h2>
          <ol className="flex flex-col divide-y divide-rule border border-rule bg-white">
            {ACADEMY.map(([when, what]) => (
              <li key={when} className="flex flex-col gap-1 p-6 sm:flex-row sm:gap-8">
                <span className="type-display-s w-32 shrink-0 text-midnight/65">{when}</span>
                <p className="type-body-s text-midnight/80">{what}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="type-display-m text-midnight">The split, and where it goes</h2>
          <div className="overflow-x-auto border border-rule bg-white">
            <table className="w-full min-w-[34rem] border-collapse">
              <thead>
                <tr className="border-b border-rule">
                  {["Tier", "Commission split", "What changes"].map((h) => (
                    <th key={h} className="type-eyebrow p-3 text-start text-midnight/65">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIERS.map(([tier, split, note]) => (
                  <tr key={tier} className="border-b border-rule/60">
                    <td className="type-body-s p-3 font-medium text-midnight">{tier}</td>
                    <td className="type-body-s p-3 text-midnight">{split}</td>
                    <td className="type-body-s p-3 text-midnight/70">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="type-micro max-w-3xl text-midnight/65">
            Splits are indicative of the current structure and are confirmed in
            your offer letter.
          </p>
        </section>

        {/* Application — 60-second video, not a CV */}
        <section id="apply" className="scroll-mt-24">
          <CropMarks>
            <div className="flex flex-col gap-6 bg-sand p-8">
              <div className="flex flex-col gap-2">
                <h2 className="type-display-m text-midnight">Send 60 seconds, not a CV</h2>
                <p className="type-body max-w-2xl text-midnight/80">
                  Record yourself answering one question: why should someone who
                  has never met you move seven figures on your word? Upload it
                  anywhere — Drive, Dropbox, YouTube unlisted — and paste the link.
                </p>
              </div>

              <Suspense fallback={null}>
                <SentBanner consultant="The hiring desk" />
              </Suspense>

              <form action={createLead} className="grid max-w-3xl gap-4 sm:grid-cols-2">
                <input type="hidden" name="returnTo" value={`/${locale === "en" ? "" : `${locale}/`}careers`.replace("//", "/")} />
                <input type="hidden" name="sourcePage" value="/careers" />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="leadKind" value="career" />
                <div className="hidden" aria-hidden>
                  <input type="text" name="company" tabIndex={-1} autoComplete="off" />
                </div>
                <Field id="career-name" name="name" label="Full name" required />
                <Field id="career-email" name="email" type="email" label="Email" required />
                <Field id="career-phone" name="phone" type="tel" label="Phone" />
                <Field
                  id="career-video"
                  name="videoUrl"
                  type="url"
                  label="Link to your 60 seconds"
                  placeholder="https://"
                  required
                />
                <div className="sm:col-span-2">
                  <Field id="career-message" name="message" label="Anything else worth knowing" />
                </div>
                <label className="type-body-s flex items-start gap-2 text-midnight sm:col-span-2">
                  <input type="checkbox" name="marketingConsent" className="mt-1 h-4 w-4 accent-[var(--alcazar-blue)]" />
                  You may keep my details on file for future openings.
                </label>
                <button
                  type="submit"
                  className="type-eyebrow bg-blue px-6 py-3.5 text-sand transition-colors duration-fast ease-brand hover:bg-midnight sm:col-span-2 sm:justify-self-start"
                >
                  Send application
                </button>
              </form>
              <p className="type-micro max-w-2xl text-midnight/65">
                We reply to every application, including the ones we decline. Your
                data is held under our privacy policy and deleted on request.
              </p>
            </div>
          </CropMarks>
        </section>
      </div>
    </div>
  );
}
