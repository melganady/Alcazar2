import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/sections/PageHero";
import { TeamFilter } from "@/components/sections/TeamFilter";
import { getPayloadClient } from "@/lib/payload";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Consultants",
  description:
    "REIN Investment consultants by language and specialism — each with a RERA broker number, direct WhatsApp and a real reply-to address.",
};

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const payload = await getPayloadClient();
  const agents = await payload.find({ collection: "agents", limit: 100, sort: "slug", depth: 1 });

  return (
    <>
      <PageHero
        eyebrow="REIN Investment · Consultants"
        title="Named, not pooled"
        support="Every enquiry reaches a person with a broker number, not a shared inbox. Filter by the language you want to be sold in."
        compact
      />
      <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-12 md:px-6">
      {/* Filters over nothing read as a broken page. Until consultants are
          entered, the enquiry route is the desk itself. */}
      {agents.docs.length === 0 ? (
        <p className="type-body max-w-2xl text-navy/80">
          Consultant profiles publish once each broker card is current — we will
          not put a name and a BRN on the site before we can stand behind both.
          In the meantime an enquiry reaches the desk directly through{" "}
          <Link href="/contact" className="underline underline-offset-4 hover:text-navy">
            the contact form
          </Link>
          .
        </p>
      ) : (
      <TeamFilter
        agents={agents.docs.map((a) => ({
          id: String(a.id),
          slug: a.slug,
          name: a.name,
          role: a.role,
          brn: a.brn,
          brnExpiry: a.brnExpiry ?? null,
          languages: a.languages ?? [],
          specialisms: a.specialisms ?? [],
          bio: a.bio ?? null,
          whatsapp: a.whatsapp ?? null,
          email: a.email ?? null,
        }))}
      />
      )}
      </div>
    </>
  );
}
