import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { alternates } from "@/lib/seo";
import { getComplianceIdentity } from "@/lib/legalEntity";

export const dynamicParams = false;

type Section = { h: string; p: string[] };
type LegalDoc = { title: string; intro: string; sections: Section[] };

const ESCROW =
  "Purchase payments are made to the developer's DLD-registered escrow account. REIN Investment does not hold client funds.";

const buildDocs = (identityLine: string): Record<string, LegalDoc> => ({
  privacy: {
    title: "Privacy policy",
    intro:
      "How REIN Investment collects, uses and retains personal data, under UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL).",
    sections: [
      {
        h: "What we collect and why",
        p: [
          "When you submit an enquiry we collect your name, contact details, residency status, budget band, purpose and whether you need financing. We collect this to respond to your enquiry and to show you projects and financing routes that are actually available to you — residency status in particular changes what we can show.",
          "When you use the mortgage calculator we do not store your inputs unless you ask us to email the breakdown, in which case we store the scenario alongside your name and email.",
          "If you apply for a role we collect your contact details and the link you provide.",
        ],
      },
      {
        h: "Lawful basis",
        p: [
          "We process enquiry data to take steps at your request prior to entering a contract, and on the basis of our legitimate interest in responding to prospective clients. Marketing messages and WhatsApp contact are processed on consent only — each is a separate, unticked checkbox, and withdrawing one does not affect the other or our reply to your enquiry.",
        ],
      },
      {
        h: "Who we share it with",
        p: [
          "Our CRM and email providers, as processors acting on our instructions. Where you ask us to arrange financing, the lenders you approve. Where you proceed to purchase, the developer and the Dubai Land Department as required to register the transaction. We do not sell personal data.",
        ],
      },
      {
        h: "Retention",
        p: [
          "Enquiry records are retained for 24 months from last contact, then deleted. Transaction records are retained for the period required by UAE brokerage and anti-money-laundering rules. Job applications are retained for 12 months, or longer if you consent.",
        ],
      },
      {
        h: "Your rights",
        p: [
          "You may request access to your data, correction, deletion, restriction of processing, or a copy in portable form, and you may withdraw consent at any time. Write to the address below and we will respond within 30 days. You may also complain to the UAE Data Office.",
        ],
      },
      {
        h: "Contact",
        p: [identityLine],
      },
    ],
  },
  terms: {
    title: "Terms of use",
    intro: "The terms on which REIN Investment provides this website.",
    sections: [
      {
        h: "What this site is",
        p: [
          "This site presents a selected shortlist of off-plan property together with our own written assessment. Property information is supplied by developers and by public Dubai Land Department records. Prices, availability, specifications and handover dates are set by the developer and change without notice to us.",
          "Nothing on this site is an offer capable of acceptance, and no information here forms part of any contract.",
        ],
      },
      {
        h: "Advertising permits",
        p: [
          "Every property advertisement we publish carries its Trakheesi permit number. Each consultant is identified by their RERA broker number. Our ORN and trade licence number appear in the footer of every page.",
        ],
      },
      {
        h: "Financing",
        p: [
          "REIN Investment acts as an intermediary and is not a lender. Figures produced by the mortgage calculator are indicative, are not an offer of finance, and do not guarantee approval. Lender criteria, rates and fees vary and change. Your property may be repossessed if you do not keep up repayments.",
        ],
      },
      { h: "Client funds", p: [ESCROW] },
      {
        h: "Our content",
        p: [
          "The written assessments, comparisons and editorial on this site are ours. You may quote them with attribution and a link. Bulk copying, scraping or republication is not permitted.",
        ],
      },
      {
        h: "Governing law",
        p: ["These terms are governed by the laws of the United Arab Emirates as applied in the Emirate of Dubai."],
      },
    ],
  },
  disclaimer: {
    title: "Investment disclaimer",
    intro: "The risks that come with buying property before it is built.",
    sections: [
      {
        h: "Projections are not guarantees",
        p: [
          "Any yield, price, appreciation or handover date on this site is an estimate or a developer statement, not a promise. Off-plan property carries construction risk, delivery risk, market risk and liquidity risk. Values can fall as well as rise, and a project can be delayed, redesigned or cancelled.",
        ],
      },
      {
        h: "Handover dates",
        p: [
          "Handover quarters are the developer's stated target. Where we publish a developer's average historical slippage, it is drawn from their delivered projects and is context, not a forecast.",
        ],
      },
      {
        h: "Our assessments",
        p: [
          "Our written view and filter scores are our opinion at the date of writing, formed from the information available to us. They are not financial advice, not a personal recommendation, and not a substitute for your own due diligence or independent legal and tax advice.",
        ],
      },
      { h: "Financing", p: [
        "REIN Investment is not a lender and does not guarantee any financing outcome. Indicative regulatory caps and fees are published with the date they took effect and the source we relied on.",
      ] },
      { h: "Client funds", p: [ESCROW] },
    ],
  },
  cookies: {
    title: "Cookie policy",
    intro: "What we store on your device, and what you can turn off.",
    sections: [
      {
        h: "Essential cookies",
        p: [
          "Your currency, unit (sqft or sqm) and language preferences, and your cookie choice itself. These are first-party, set only by us, and required for the site to work as you configured it. They cannot be turned off from the banner, but clearing your browser storage removes them.",
        ],
      },
      {
        h: "Analytics cookies",
        p: [
          "Optional. They tell us which pages help people find and understand a project. No analytics script loads and no analytics cookie is set until you choose Accept all. Choosing Reject all means none of it runs — not a reduced version of it.",
        ],
      },
      {
        h: "Changing your mind",
        p: [
          "Clear the rein-consent cookie in your browser and the banner will ask again on your next visit. Reject all is offered with the same prominence as Accept all, every time.",
        ],
      },
      {
        h: "Third parties",
        p: [
          "We do not run advertising or cross-site tracking cookies. Where a page embeds a map, it loads only after you interact with it.",
        ],
      },
    ],
  },
});

export function generateStaticParams() {
  return ["privacy", "terms", "disclaimer", "cookies"].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = buildDocs("")[slug];
  if (!doc) return {};
  return {
    title: doc.title,
    description: doc.intro,
    alternates: alternates(`/legal/${slug}`),
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const identity = await getComplianceIdentity();
  const doc = buildDocs(
    [identity.licenceLine, ...identity.registrations, identity.city].filter(Boolean).join(" · "),
  )[slug];
  if (!doc) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-12 md:px-6">
      <header className="flex flex-col gap-3">
        <Eyebrow>REIN Investment · Legal</Eyebrow>
        <h1 className="type-display-l text-navy">{doc.title}</h1>
        <p className="type-body-l text-navy/80">{doc.intro}</p>
      </header>

      <div className="flex flex-col gap-8">
        {doc.sections.map((s) => (
          <section key={s.h} className="flex flex-col gap-3 border-t border-rule pt-6">
            <h2 className="type-display-s text-navy">{s.h}</h2>
            {s.p.map((p, i) => (
              <p key={i} className="type-body text-navy/80">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      <p className="type-micro text-navy/80">
        These pages are drafted for review by counsel before launch and are not
        legal advice.
      </p>
    </div>
  );
}
