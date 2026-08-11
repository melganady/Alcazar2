import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { getPayloadClient } from "@/lib/payload";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Market, mortgage, community and developer analysis from the Alcázar desk — written by the people who run the filter.",
};

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const payload = await getPayloadClient();
  const articles = await payload.find({
    collection: "articles",
    where: { publishedAt: { exists: true } },
    sort: "-publishedAt",
    limit: 50,
    depth: 1,
  });

  return (
    <div className="mx-auto flex max-w-container flex-col gap-10 px-4 py-12 md:px-6">
      <header className="flex flex-col gap-3">
        <Eyebrow>Alcázar · Insights</Eyebrow>
        <h1 className="type-display-l text-blue">Insights</h1>
        <p className="type-body-l max-w-2xl text-midnight/80">
          Market, mortgage, community and developer analysis — written by the desk
          that runs the filter, not by a content agency.
        </p>
      </header>

      {articles.docs.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.docs.map((a) => (
            <Link
              key={a.id}
              href={`/insights/${a.slug}`}
              className="group flex flex-col gap-2 border border-rule bg-white p-5 transition-colors duration-fast ease-brand hover:border-blue"
            >
              <span className="type-micro uppercase text-midnight/50">{a.category}</span>
              <h2 className="type-display-s text-midnight group-hover:text-blue">{a.title}</h2>
              {a.excerpt ? <p className="type-body-s text-midnight/70">{a.excerpt}</p> : null}
              {a.publishedAt ? (
                <span className="type-micro mt-1 text-midnight/50">
                  {String(a.publishedAt).slice(0, 10)}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className="type-body text-midnight/70">
          The first articles publish with launch. Project pages already carry our
          written view on every listing.
        </p>
      )}
    </div>
  );
}
