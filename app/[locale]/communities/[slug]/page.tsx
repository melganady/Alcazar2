import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { StatBlock } from "@/components/primitives/StatBlock";
import { ProjectCard } from "@/components/project/ProjectCard";
import { CompareProvider } from "@/components/project/CompareProvider";
import { getCommunityBySlug } from "@/lib/directory";
import { getPayloadClient } from "@/lib/payload";
import { alternates, breadcrumbJsonLd, BASE_URL } from "@/lib/seo";
import { formatHandoverOrDash } from "@/lib/format";

export const revalidate = 3600;

export async function generateStaticParams() {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "communities",
    limit: 300,
    depth: 0,
    select: { slug: true },
  });
  return res.docs.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = await getCommunityBySlug(slug);
  if (!found) return {};
  const { community, projects } = found;
  const priced = projects.map((p) => p.priceFromAED).filter((v) => v > 0);
  const floor = priced.length > 0 ? Math.min(...priced) : undefined;
  return {
    title: `${community.name}, ${community.region} — projects and entry prices`,
    description: `${projects.length} projects in ${community.name}${
      floor ? `, from AED ${floor.toLocaleString("en-AE")}` : ""
    }. What is available and what completes nearby.`,
    alternates: alternates(`/communities/${slug}`),
  };
}

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const found = await getCommunityBySlug(slug);
  if (!found) notFound();
  const { community, projects } = found;

  // Ignore feed records with no price, which import as 0.
  const priced = projects.map((p) => p.priceFromAED).filter((v) => v > 0);
  const priceFloor = priced.length > 0 ? Math.min(...priced) : undefined;

  // Supply in window — the fifth test, made concrete for the area.
  const byYear = projects.reduce<Record<string, number>>((acc, p) => {
    const key = p.handoverYear ? String(p.handoverYear) : "unscheduled";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const years = Object.entries(byYear)
    .filter(([y]) => y !== "unscheduled")
    .sort(([a], [b]) => Number(a) - Number(b));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: community.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: community.name,
      addressRegion: community.region,
      addressCountry: "AE",
    },
    geo:
      community.lat != null && community.lng != null
        ? { "@type": "GeoCoordinates", latitude: community.lat, longitude: community.lng }
        : undefined,
    url: `${BASE_URL}/communities/${slug}`,
  };

  return (
    <CompareProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Communities", path: "/communities" },
              { name: community.name, path: `/communities/${slug}` },
            ]),
          ),
        }}
      />
      <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-12 md:px-6">
        <header className="flex flex-col gap-3">
          <Eyebrow>{community.region}</Eyebrow>
          <h1 className="type-display-l text-iron">{community.name}</h1>
        </header>

        <div className="grid grid-cols-2 gap-8 border-y border-rule py-8 sm:grid-cols-4">
          <StatBlock value={String(projects.length)} label="Projects on our books" />
          {priceFloor ? (
            <StatBlock
              value={`AED ${(priceFloor / 1_000_000).toFixed(1)}M`}
              label="Entry price from"
            />
          ) : null}
          {community.avgPricePerSqft ? (
            <StatBlock
              value={`AED ${community.avgPricePerSqft.toLocaleString("en-AE")}`}
              label="Avg price / sqft"
            />
          ) : null}
          {community.avgRentalYieldPct ? (
            <StatBlock value={`${community.avgRentalYieldPct}%`} label="Avg rental yield" />
          ) : null}
        </div>

        {community.description ? (
          <section className="flex max-w-3xl flex-col gap-3">
            <h2 className="type-display-m text-iron">The area</h2>
            <div className="type-body text-iron/80 [&_p]:mb-3">
              <RichText data={community.description} />
            </div>
          </section>
        ) : null}

        {years.length > 0 ? (
          <section className="flex flex-col gap-4">
            <h2 className="type-display-m text-iron">Supply in window</h2>
            <p className="type-body max-w-2xl text-iron/80">
              What completes here, and when. Your exit competes with every one of
              these.
            </p>
            <ul className="flex flex-wrap gap-x-10 gap-y-4">
              {years.map(([year, count]) => (
                <li key={year} className="flex min-w-32 flex-col gap-1 border-t border-rule pt-4">
                  <span className="type-display-s text-iron">{year}</span>
                  <span className="type-body-s text-iron/80">
                    {count} {count === 1 ? "project" : "projects"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {community.transportNotes || community.schoolsNotes ? (
          <section className="grid max-w-4xl gap-8 border-t border-rule pt-10 md:grid-cols-2">
            {community.transportNotes ? (
              <div className="flex flex-col gap-2">
                <h2 className="type-display-s text-iron">Getting around</h2>
                <p className="type-body-s text-iron/80">{community.transportNotes}</p>
              </div>
            ) : null}
            {community.schoolsNotes ? (
              <div className="flex flex-col gap-2">
                <h2 className="type-display-s text-iron">Schools</h2>
                <p className="type-body-s text-iron/80">{community.schoolsNotes}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        {projects.length > 0 ? (
          <section className="flex flex-col gap-6 border-t border-rule pt-10">
            <h2 className="type-display-m text-iron">Available here</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
            <p className="type-micro text-iron/80">
              Handover windows:{" "}
              {projects
                .map((p) => formatHandoverOrDash(p.handoverQuarter, p.handoverYear))
                .filter((v, i, a) => v !== "—" && a.indexOf(v) === i)
                .join(" · ")}
            </p>
          </section>
        ) : null}
      </div>
    </CompareProvider>
  );
}
