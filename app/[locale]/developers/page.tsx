import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Eyebrow } from "@/components/primitives/Eyebrow";
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

  return (
    <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-12 md:px-6">
      <header className="flex flex-col gap-3">
        <Eyebrow>Alcázar · Developers</Eyebrow>
        <h1 className="type-display-l text-iron">Who builds it matters</h1>
        <p className="type-body-l max-w-2xl text-iron/80">
          Developer record is the first of our eight tests. What they have
          delivered, and how late, decides whether their stock reaches you.
        </p>
      </header>

      {developers.length > 0 ? (
        <>
          <p aria-live="polite" className="type-eyebrow text-iron/80">
            {developers.length} developers with assets on our books
          </p>
          <DirectoryGrid
            entries={developers}
            basePath="/developers"
            countLabel={(n) => `${n} ${n === 1 ? "project" : "projects"}`}
          />
        </>
      ) : (
        <p className="type-body text-iron/80">
          Developer profiles publish alongside their first listed project.
        </p>
      )}
    </div>
  );
}
