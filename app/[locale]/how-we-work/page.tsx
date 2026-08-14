import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { CropMarks } from "@/components/primitives/CropMarks";
import { EIGHT_TESTS, FIVE_STAGES, VERBATIM } from "@/lib/content";

export const metadata: Metadata = {
  title: "How we work — the eight-test filter",
  description:
    "Eight tests every off-plan launch runs before it reaches a client shortlist: developer record, regulatory standing, price, payment structure, supply, exit terms, running cost, unit quality.",
};

export default async function HowWeWorkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHero
        eyebrow="REIN Investment · The method"
        title="Most launches do not pass"
        support="We are not a portal. We publish a defended shortlist, which means every project on this site survived the same eight tests — and the ones that did not are on record as declined."
        compact
      />
      <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-12 md:px-6">
      <section className="flex flex-col gap-6">
        <h2 className="type-display-m text-navy">The eight tests</h2>
        <div className="grid gap-x-8 gap-y-8 md:grid-cols-2">
          {EIGHT_TESTS.map((test, i) => (
            <div key={test.key} className="flex flex-col gap-2 border-t border-rule pt-5">
              <span aria-hidden className="type-micro text-steel">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="type-display-s text-navy">{test.title}</h3>
              <p className="type-body-s text-navy/80">{test.body}</p>
            </div>
          ))}
        </div>
      </section>

      <CropMarks className="self-start">
        <div className="bg-steel/18 p-8">
          <p className="type-display-m max-w-2xl text-navy">{VERBATIM.theTest}</p>
        </div>
      </CropMarks>

      <section className="flex flex-col gap-6">
        <h2 className="type-display-m text-navy">The five stages</h2>
        <ol className="flex flex-col divide-y divide-rule border border-rule bg-surface">
          {FIVE_STAGES.map((s) => (
            <li key={s.n} className="flex flex-col gap-2 p-6 sm:flex-row sm:gap-8">
              <span aria-hidden className="type-display-s w-12 shrink-0 text-steel">{s.n}</span>
              <div className="flex flex-col gap-1">
                <h3 className="type-display-s text-navy">{s.title}</h3>
                <p className="type-body-s text-navy/80">{s.line}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="type-display-m text-navy">What we publish when a project fails</h2>
        <p className="type-body-l max-w-2xl text-navy/80">
          Nothing else in this market publishes its rejections. Where the team
          decides a decline is instructive and the facts are clean, the project
          keeps a page — stripped to facts and the reason it did not pass. No
          gallery, no call to action.
        </p>
        <Link href="/projects" className="type-eyebrow self-start text-navy underline-offset-4 hover:underline">
          See the shortlist →
        </Link>
      </section>
      </div>
    </>
  );
}
