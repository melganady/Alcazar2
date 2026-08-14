import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/sections/PageHero";
import { DirectoryGrid } from "@/components/sections/DirectoryGrid";
import { getCommunities } from "@/lib/directory";
import { alternates } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Communities",
  description:
    "The communities we place capital into — what is available, at what entry price, and what completes nearby.",
  alternates: alternates("/communities"),
};

export default async function CommunitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const communities = await getCommunities();
  const lead = communities.find((c) => c.image);

  return (
    <>
      <PageHero
        eyebrow="REIN Investment · Communities"
        title="Location is the one thing you cannot renovate"
        support="Supply in window is the fifth of our eight tests. Your exit competes with everything completing around you."
        image={lead?.image ? { url: lead.image, alt: lead.imageAlt ?? lead.name } : null}
        caption={lead?.image ? lead.name : undefined}
      />
      <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-12 md:px-6">
        {communities.length > 0 ? (
          <>
            <p aria-live="polite" className="type-eyebrow text-navy/80">
              {communities.length} communities with assets on our books
            </p>
            <DirectoryGrid
              entries={communities}
              basePath="/communities"
              countLabel={(n) => `${n} ${n === 1 ? "project" : "projects"}`}
            />
          </>
        ) : (
          <p className="type-body text-navy/80">
            We publish an area once we have stock in it and a view worth reading.
          </p>
        )}
      </div>
    </>
  );
}
