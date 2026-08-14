import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/sections/PageHero";
import { DirectoryGrid } from "@/components/sections/DirectoryGrid";
import { getDevelopers } from "@/lib/directory";
import { alternates } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Developers",
  description:
    "The developers behind the assets we place — delivery record, projects on our books, and entry prices.",
  alternates: alternates("/developers"),
};

export default async function DevelopersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const developers = await getDevelopers();
  // Leads with whichever developer's render we actually hold — usually the
  // one carrying the most stock, since the list sorts by project count.
  const lead = developers.find((d) => d.image);

  return (
    <>
      <PageHero
        eyebrow="REIN Investment · Developers"
        title="Who builds it matters"
        support="Developer record is the first of our eight tests. What they have delivered, and how late, decides whether their stock reaches you."
        image={lead?.image ? { url: lead.image, alt: lead.imageAlt ?? lead.name } : null}
        caption={lead?.image ? lead.name : undefined}
      />
      <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-12 md:px-6">
        {developers.length > 0 ? (
          <>
            <p aria-live="polite" className="type-eyebrow text-navy/80">
              {developers.length} developers with assets on our books
            </p>
            <DirectoryGrid
              entries={developers}
              basePath="/developers"
              countLabel={(n) => `${n} ${n === 1 ? "project" : "projects"}`}
            />
          </>
        ) : (
          <p className="type-body text-navy/80">
            We publish a developer once we hold a delivery record we have checked ourselves.
          </p>
        )}
      </div>
    </>
  );
}
