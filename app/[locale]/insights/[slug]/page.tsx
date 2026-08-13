import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { ProjectCard } from "@/components/project/ProjectCard";
import { CompareProvider } from "@/components/project/CompareProvider";
import { getPayloadClient } from "@/lib/payload";
import { staticParamsOrEmpty } from "@/lib/buildTime";
import type { Agent, Project } from "@/payload-types";

export const revalidate = 3600;

async function getArticle(slug: string) {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "articles",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  });
  return res.docs[0] ?? null;
}

export async function generateStaticParams() {
  return staticParamsOrEmpty("articles", async () => {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "articles",
      where: { publishedAt: { exists: true } },
      limit: 200,
      depth: 0,
      select: { slug: true },
    });
    return res.docs.map((d) => ({ slug: d.slug }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  return { title: article.title, description: article.excerpt ?? undefined };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const article = await getArticle(slug);
  if (!article || !article.publishedAt) notFound();

  const author =
    article.author && typeof article.author === "object" ? (article.author as Agent) : null;
  const relatedProjects = (article.relatedProjects ?? []).filter(
    (p): p is Project => typeof p === "object" && p !== null,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt2 ?? article.publishedAt,
    author: author ? { "@type": "Person", name: author.name } : undefined,
    publisher: { "@type": "Organization", name: "Alcázar" },
  };

  const faqJsonLd =
    article.faq && article.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <CompareProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      ) : null}

      <article className="mx-auto flex max-w-container flex-col gap-10 px-4 py-12 md:px-6">
        <header className="flex max-w-3xl flex-col gap-3">
          <Eyebrow>{article.category}</Eyebrow>
          <h1 className="type-display-l text-iron">{article.title}</h1>
          <p className="type-body-s text-iron/80">
            {author ? `${author.name} · ${author.role} · ` : ""}
            {String(article.publishedAt).slice(0, 10)}
          </p>
        </header>

        {article.body ? (
          <div className="type-body-l max-w-3xl text-iron/85 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:uppercase [&_h2]:tracking-display-m [&_h2]:text-iron [&_p]:mb-4">
            <RichText data={article.body} />
          </div>
        ) : null}

        {article.faq && article.faq.length > 0 ? (
          <section className="flex max-w-3xl flex-col gap-4">
            <h2 className="type-display-m text-iron">Questions</h2>
            <div className="flex flex-col divide-y divide-rule border border-rule bg-linen">
              {article.faq.map((f) => (
                <details key={f.id ?? f.q} className="p-5">
                  <summary className="type-body cursor-pointer font-medium text-iron underline-offset-4 hover:underline">
                    {f.q}
                  </summary>
                  <p className="type-body mt-3 text-iron/80">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        {relatedProjects.length > 0 ? (
          <section className="flex flex-col gap-5 border-t border-rule pt-10">
            <h2 className="type-display-m text-iron">Projects in this piece</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProjects.slice(0, 3).map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
        ) : null}

        <Link href="/insights" className="type-eyebrow self-start text-iron/80 hover:underline hover:underline-offset-4">
          ← Insights
        </Link>
      </article>
    </CompareProvider>
  );
}
