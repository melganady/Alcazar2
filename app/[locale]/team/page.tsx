import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { TeamFilter } from "@/components/sections/TeamFilter";
import { getPayloadClient } from "@/lib/payload";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Consultants",
  description:
    "Alcázar consultants by language and specialism — each with a RERA broker number, direct WhatsApp and a real reply-to address.",
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
    <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-12 md:px-6">
      <header className="flex flex-col gap-3">
        <Eyebrow>Alcázar · Consultants</Eyebrow>
        <h1 className="type-display-l text-iron">Named, not pooled</h1>
        <p className="type-body-l max-w-2xl text-iron/80">
          Every enquiry reaches a person with a broker number, not a shared inbox.
          Filter by the language you want to be sold in.
        </p>
      </header>
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
    </div>
  );
}
