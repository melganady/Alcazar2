import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { CropMarks } from "@/components/primitives/CropMarks";
import { VERBATIM } from "@/lib/content";
import { getComplianceIdentity } from "@/lib/legalEntity";
import { getHeroShowcase } from "@/lib/showcase";

export const metadata: Metadata = {
  title: "About the house",
  description:
    "Alcázar is a UAE off-plan real estate advisory and mortgage consultancy in Dubai, selecting and underwriting pre-construction assets for private investors.",
};

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [identity, image] = await Promise.all([getComplianceIdentity(), getHeroShowcase()]);

  return (
    <>
      <PageHero
        eyebrow="Alcázar · The house"
        title={VERBATIM.tagline}
        support={VERBATIM.positioning}
        image={image}
        caption={image?.project}
      />
      <div className="mx-auto flex max-w-container flex-col gap-14 px-4 py-12 md:px-6">
      <section className="grid gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="type-display-m text-iron">What we do</h2>
          <p className="type-body text-iron/80">
            We select, underwrite and place pre-construction residential assets
            for private investors, and we arrange mortgages for UAE residents and
            non-residents. Two disciplines, one desk: the financing route is
            decided before the unit is, because for most of our clients it is the
            financing that sets the ceiling.
          </p>
          <p className="type-body text-iron/80">
            We are selective by construction. A portal earns on volume; we earn on
            being right. That is why this site publishes a shortlist rather than an
            inventory, and why every project carries our written view.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="type-display-m text-iron">Who we work with</h2>
          <p className="type-body text-iron/80">
            HNW and UHNW private investors, most of them international and many
            buying remotely, in English or Arabic. On the other side, developers
            deciding who gets launch allocation — a decision that turns on whether
            a broker can actually place stock with committed buyers.
          </p>
          <p className="type-body text-iron/80">
            And the brokers we hire: young, fast, and trained here rather than
            recruited off a competitor&rsquo;s floor.
          </p>
          <Link href="/careers" className="type-eyebrow self-start text-iron underline-offset-4 hover:underline">
            {VERBATIM.careersHeadline} →
          </Link>
        </div>
      </section>

      <CropMarks className="self-start">
        <div className="bg-pine/18 p-8">
          <p className="type-display-m max-w-2xl text-iron">{VERBATIM.theTest}</p>
        </div>
      </CropMarks>

      <section className="flex flex-col gap-4">
        <h2 className="type-display-m text-iron">The licence</h2>
        <p className="type-body max-w-2xl text-iron/80">
          {[identity.licenceLine, ...identity.registrations, identity.city].filter(Boolean).join(" · ")}. Every
          advert we publish carries its Trakheesi permit number; every consultant
          carries a RERA broker number. Purchase payments go to the developer&rsquo;s
          DLD-registered escrow account — Alcázar does not hold client funds.
        </p>
      </section>
      </div>
    </>
  );
}
