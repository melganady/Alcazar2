import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { StatBlock } from "@/components/primitives/StatBlock";
import { ProjectCard } from "@/components/project/ProjectCard";
import { CompareProvider } from "@/components/project/CompareProvider";
import { getDeveloperBySlug } from "@/lib/directory";
import { getPayloadClient } from "@/lib/payload";
import { alternates, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "developers",
    limit: 300,
    depth: 0,
    select: { slug: true },
  });
  return res.docs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = await getDeveloperBySlug(slug);
  if (!found) return {};
  const { developer, projects } = found;
  return {
    title: `${developer.name} — delivery record and projects`,
    description: `${developer.name}: ${projects.length} projects on the Alcázar books${
      developer.projectsDelivered ? `, ${developer.projectsDelivered} delivered to date` : ""
    }.`,
    alternates: alternates(`/developers/${slug}`),
  };
}

export default async function DeveloperPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const found = await getDeveloperBySlug(slug);
  if (!found) notFound();
  const { developer, projects } = found;

  const stats = [
    developer.foundedYear ? { value: String(developer.foundedYear), label: "Founded" } : null,
    developer.projectsDelivered != null
      ? { value: String(developer.projectsDelivered), label: "Projects delivered" }
      : null,
    developer.averageHandoverSlippageMonths != null
      ? {
          value: `${developer.averageHandoverSlippageMonths} mo`,
          label: "Avg handover slippage",
        }
      : null,
    { value: String(projects.length), label: "On our books" },
  ].filter((s): s is { value: string; label: string } => Boolean(s));

  return (
    <CompareProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Developers", path: "/developers" },
              { name: developer.name, path: `/developers/${slug}` },
            ]),
          ),
        }}
      />
      <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-12 md:px-6">
        <header className="flex flex-col gap-3">
          <Eyebrow>
            Developer
            {developer.headquarters ? ` · ${developer.headquarters}` : ""}
          </Eyebrow>
          <h1 className="type-display-l text-iron">{developer.name}</h1>
        </header>

        {stats.length > 0 ? (
          <div className="grid grid-cols-2 gap-8 border-y border-rule py-8 sm:grid-cols-4">
            {stats.map((s) => (
              <StatBlock key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        ) : null}

        {developer.deliveryTrackRecord ? (
          <section className="flex max-w-3xl flex-col gap-3">
            <h2 className="type-display-m text-iron">Delivery record</h2>
            <div className="type-body text-iron/80 [&_p]:mb-3">
              <RichText data={developer.deliveryTrackRecord} />
            </div>
          </section>
        ) : (
          <p className="type-body-s max-w-2xl text-iron/80">
            Delivery record under review. We publish a track record once we have
            verified it against completed projects, not from the developer&rsquo;s
            own marketing.
          </p>
        )}

        {projects.length > 0 ? (
          <section className="flex flex-col gap-6 border-t border-rule pt-10">
            <h2 className="type-display-m text-iron">
              {projects.length === 1 ? "Their project" : "Their projects"}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
        ) : null}

        <p className="type-micro max-w-3xl text-iron/80">
          Delivery figures are our own record where stated. Projections are not
          guarantees; off-plan property carries construction, delivery, market
          and liquidity risk.
        </p>
      </div>
    </CompareProvider>
  );
}
