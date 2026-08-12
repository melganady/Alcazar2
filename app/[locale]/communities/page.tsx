import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Eyebrow } from "@/components/primitives/Eyebrow";
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

  return (
    <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-12 md:px-6">
      <header className="flex flex-col gap-3">
        <Eyebrow>Alcázar · Communities</Eyebrow>
        <h1 className="type-display-l text-iron">Location is the one thing you cannot renovate</h1>
        <p className="type-body-l max-w-2xl text-iron/80">
          Supply in window is the fifth of our eight tests. Your exit competes
          with everything completing around you.
        </p>
      </header>

      {communities.length > 0 ? (
        <>
          <p aria-live="polite" className="type-eyebrow text-iron/80">
            {communities.length} communities with assets on our books
          </p>
          <DirectoryGrid
            entries={communities}
            basePath="/communities"
            countLabel={(n) => `${n} ${n === 1 ? "project" : "projects"}`}
          />
        </>
      ) : (
        <p className="type-body text-iron/80">
          We publish an area once we have stock in it and a view worth reading.
        </p>
      )}
    </div>
  );
}
