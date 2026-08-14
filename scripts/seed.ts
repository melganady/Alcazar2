/*
 * Development fixtures (§5): 40 projects with FICTIONAL project and developer
 * names set in real communities. All rows carry isFixture: true and are
 * excluded from production builds. Run: npx payload run scripts/seed.ts
 */
import { getPayload } from "payload";
import config from "../payload.config";

const rt = (text: string) => ({
  root: {
    type: "root",
    format: "" as const,
    indent: 0,
    version: 1,
    direction: null,
    children: [
      {
        type: "paragraph",
        version: 1,
        children: [{ type: "text", text, version: 1 }],
      },
    ],
  },
});

const COMMUNITIES = [
  { slug: "dubai-islands", name: "Dubai Islands", emirate: "Dubai", lat: 25.303, lng: 55.305, ppsf: 2300, yield: 6.1 },
  { slug: "business-bay", name: "Business Bay", emirate: "Dubai", lat: 25.185, lng: 55.263, ppsf: 2450, yield: 6.4 },
  { slug: "dubai-creek-harbour", name: "Dubai Creek Harbour", emirate: "Dubai", lat: 25.203, lng: 55.348, ppsf: 2500, yield: 5.8 },
  { slug: "jumeirah-village-circle", name: "Jumeirah Village Circle", emirate: "Dubai", lat: 25.06, lng: 55.206, ppsf: 1450, yield: 7.4 },
  { slug: "dubai-hills-estate", name: "Dubai Hills Estate", emirate: "Dubai", lat: 25.108, lng: 55.244, ppsf: 2600, yield: 5.6 },
  { slug: "palm-jebel-ali", name: "Palm Jebel Ali", emirate: "Dubai", lat: 24.99, lng: 54.99, ppsf: 3400, yield: 4.9 },
  { slug: "dubai-marina", name: "Dubai Marina", emirate: "Dubai", lat: 25.08, lng: 55.14, ppsf: 2350, yield: 6.6 },
  { slug: "meydan", name: "Meydan", emirate: "Dubai", lat: 25.155, lng: 55.3, ppsf: 2100, yield: 6.0 },
  { slug: "yas-island", name: "Yas Island", emirate: "Abu Dhabi", lat: 24.495, lng: 54.605, ppsf: 1800, yield: 6.8 },
  { slug: "al-marjan-island", name: "Al Marjan Island", emirate: "Ras Al Khaimah", lat: 25.678, lng: 55.7, ppsf: 1650, yield: 7.1 },
] as const;

const DEVELOPERS = [
  { slug: "meridian-developments", name: "Meridian Developments", founded: 2004, delivered: 38, slippage: 4 },
  { slug: "qamar-properties", name: "Qamar Properties", founded: 2012, delivered: 14, slippage: 7 },
  { slug: "northlight-group", name: "Northlight Group", founded: 1998, delivered: 61, slippage: 2 },
  { slug: "sable-stone", name: "Sable & Stone", founded: 2016, delivered: 8, slippage: 11 },
  { slug: "helios-living", name: "Helios Living", founded: 2009, delivered: 22, slippage: 5 },
  { slug: "marlin-bay", name: "Marlin Bay Developments", founded: 2015, delivered: 9, slippage: 9 },
  { slug: "vantage-one", name: "Vantage One", founded: 2001, delivered: 44, slippage: 3 },
  { slug: "karam-estates", name: "Karam Estates", founded: 2018, delivered: 4, slippage: 14 },
] as const;

const LENDERS = [
  { name: "Gulf First Bank", res: 80, nonRes: 60, offplan: true, rate: 3.99, fixed: 3 },
  { name: "Emirates Capital Bank", res: 80, nonRes: 55, offplan: true, rate: 4.24, fixed: 5 },
  { name: "Alnoor Bank", res: 75, nonRes: 50, offplan: false, rate: 3.89, fixed: 2 },
  { name: "Crescent Home Finance", res: 80, nonRes: 60, offplan: true, rate: 4.49, fixed: 5 },
  { name: "Meydan National Bank", res: 75, nonRes: 50, offplan: false, rate: 4.09, fixed: 3 },
] as const;

const AGENTS = [
  { slug: "layla-haddad", name: "Layla Haddad", role: "Senior Investment Consultant", brn: "BRN-FIX-1001", langs: ["English", "Arabic"], specs: ["Waterfront", "Non-resident financing"] },
  { slug: "daniel-okoye", name: "Daniel Okoye", role: "Investment Consultant", brn: "BRN-FIX-1002", langs: ["English", "French"], specs: ["Business Bay", "Branded residences"] },
  { slug: "polina-ivanova", name: "Polina Ivanova", role: "Investment Consultant", brn: "BRN-FIX-1003", langs: ["English", "Russian"], specs: ["Dubai Marina", "Off-plan resale"] },
  { slug: "omar-el-sayed", name: "Omar El Sayed", role: "Mortgage Lead", brn: "BRN-FIX-1004", langs: ["English", "Arabic"], specs: ["Non-resident mortgages", "Golden Visa"] },
] as const;

const NAMES_A = ["Seabreeze", "The Meridian", "Cobalt", "Marea", "Solara", "The Wharf", "Aurelia", "Vela", "Cassia", "The Foundry", "Lumen", "Saffron", "Tide", "The Atelier", "Corniche", "Halcyon", "The Draper", "Mirabel", "Onda", "The Ledger"] as const;
const NAMES_B = ["Residences", "Quarter", "Towers", "House", "Collection", "Terraces", "Yards", "Heights", "Gardens", "Point"] as const;

const PLANS = [
  { label: "60/40", during: 60, handover: 40 },
  { label: "80/20", during: 80, handover: 20 },
  { label: "50/50", during: 50, handover: 50 },
  { label: "40/60", during: 40, handover: 60 },
  { label: "40/30/30 post-handover", during: 40, handover: 30, post: 30, months: 36 },
] as const;

const seed = async () => {
  // These rows read as real — invented lenders quoting LTVs, developers with
  // delivery statistics, named consultants. That is fine in development and a
  // misrepresentation on a licensed brokerage's live site, so the seeder will
  // not run against anything that looks like production.
  const uri = process.env.DATABASE_URI ?? "";
  if (uri.startsWith("postgres") || process.env.EXCLUDE_FIXTURES === "true") {
    console.error(
      "Refusing to seed: this looks like a production database.\n" +
        "The fixtures invent lenders, developers and consultants — none of it can go live.",
    );
    process.exit(1);
  }

  const payload = await getPayload({ config });

  const existing = await payload.count({ collection: "projects" });
  if (existing.totalDocs > 0) {
    console.log(`Projects already seeded (${existing.totalDocs}). Exiting.`);
    process.exit(0);
  }

  const users = await payload.count({ collection: "users" });
  if (users.totalDocs === 0) {
    await payload.create({
      collection: "users",
      data: { email: "admin@alcazar.ae", password: "alcazar-dev-2026", name: "Alcázar Admin" },
    });
    console.log("Admin user: admin@alcazar.ae / alcazar-dev-2026");
  }

  const communityIds: Record<string, number> = {};
  for (const c of COMMUNITIES) {
    const doc = await payload.create({
      collection: "communities",
      data: {
        slug: c.slug,
        name: c.name,
        country: "AE" as const,
        region: c.emirate,
        lat: c.lat,
        lng: c.lng,
        avgPricePerSqft: c.ppsf,
        avgRentalYieldPct: c.yield,
        description: rt(`${c.name} area guide placeholder — written in Phase 5.`),
        isFixture: true,
      },
    });
    communityIds[c.slug] = doc.id;
  }

  const developerIds: number[] = [];
  for (const d of DEVELOPERS) {
    const doc = await payload.create({
      collection: "developers",
      data: {
        slug: d.slug,
        name: d.name,
        foundedYear: d.founded,
        headquarters: "Dubai",
        projectsDelivered: d.delivered,
        averageHandoverSlippageMonths: d.slippage,
        deliveryTrackRecord: rt(`${d.name}: ${d.delivered} projects delivered since ${d.founded}, average handover slippage ${d.slippage} months. Fixture data.`),
        alcazarPanelStatus: d.slippage <= 5 ? "active" : d.slippage <= 9 ? "selective" : "not-on-panel",
        isFixture: true,
      },
    });
    developerIds.push(doc.id);
  }

  const lenderIds: number[] = [];
  for (const l of LENDERS) {
    const doc = await payload.create({
      collection: "lenders",
      data: {
        name: l.name,
        maxLtvResidentPct: l.res,
        maxLtvNonResidentPct: l.nonRes,
        financesOffplan: l.offplan,
        minMonthlyIncomeAED: 15000,
        minMonthlyIncomeNonResidentUSD: 8000,
        indicativeFixedRatePct: l.rate,
        fixedPeriodYears: l.fixed,
        onPanel: true,
        ratesEffectiveFrom: "2026-07-01",
        sourceNote: "Fixture data — not real lender terms.",
        isFixture: true,
      },
    });
    lenderIds.push(doc.id);
  }

  for (const a of AGENTS) {
    await payload.create({
      collection: "agents",
      data: {
        slug: a.slug,
        name: a.name,
        role: a.role,
        brn: a.brn,
        languages: [...a.langs],
        specialisms: [...a.specs],
        whatsapp: "+971500000000",
        email: `${a.slug.split("-")[0]}@alcazar.ae`,
        bio: "Fixture profile — replaced with real consultant data before launch.",
        isFixture: true,
      },
    });
  }

  // 40 projects, deterministic pseudo-random
  let created = 0;
  for (let i = 0; i < 40; i++) {
    const phase = i >= NAMES_A.length ? " Phase 2" : "";
    const name = `${NAMES_A[i % NAMES_A.length]} ${NAMES_B[(i * 7 + 3) % NAMES_B.length]}${phase}`;
    const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const community = COMMUNITIES[i % COMMUNITIES.length];
    const slug = `${slugBase}-${community.slug}`;
    // decorrelated from the publish/shortlist cycles so filter combos have data
    const plan = PLANS[(i * 3 + 1) % PLANS.length];
    const devIdx = (i * 5 + 2) % DEVELOPERS.length;
    const bedsMin = i % 3 === 0 ? 0 : 1;
    const bedsMax = 1 + ((i * 3 + Math.floor(i / 4)) % 4);
    const priceFrom = 800_000 + ((i * 731) % 40) * 180_000;
    const sizeFrom = 420 + ((i * 137) % 30) * 55;
    const handoverYear = 2026 + ((i * 3 + 1) % 4);
    const quarter = (["Q1", "Q2", "Q3", "Q4"] as const)[(i * 5) % 4];
    const alcazarStatus =
      i % 4 === 0 ? "shortlisted" : i % 9 === 5 ? "declined" : "monitoring";
    const published = i % 5 !== 4; // 32 published, 8 drafts
    const score = (base: number, j: number) => (((i * 13 + j * 7 + base) % 4) + 2) as 2 | 3 | 4 | 5;

    const milestones = [
      { label: "Booking", pct: 20, trigger: "On booking" },
      { label: "Construction", pct: plan.during - 20, trigger: "Staged during construction" },
      { label: "Handover", pct: plan.handover, trigger: "On handover" },
      ...("post" in plan && plan.post
        ? [{ label: "Post-handover", pct: plan.post, trigger: `${plan.months} monthly instalments` }]
        : []),
    ];

    await payload.create({
      collection: "projects",
      data: {
        slug,
        name,
        subCommunity: community.name,
        community: communityIds[community.slug],
        country: "AE" as const,
        listingType: "offplan" as const,
        region: community.emirate,
        developer: developerIds[devIdx],
        status: (["pre-launch", "launched", "under-construction"] as const)[i % 3],
        propertyTypes:
          i % 6 === 0
            ? ["Villa", "Townhouse"]
            : i % 5 === 0
              ? ["Apartment", "Penthouse", "Duplex"]
              : ["Apartment"],
        bedroomsMin: bedsMin,
        bedroomsMax: bedsMax,
        priceFromAED: priceFrom,
        priceToAED: priceFrom * (2 + (i % 3)),
        sizeFromSqft: sizeFrom,
        sizeToSqft: sizeFrom * 3,
        paymentPlan: {
          label: plan.label,
          duringConstructionPct: plan.during,
          onHandoverPct: plan.handover,
          ...("post" in plan && plan.post
            ? { postHandoverPct: plan.post, postHandoverMonths: plan.months }
            : {}),
          milestones,
        },
        handoverQuarter: quarter,
        handoverYear,
        dldProjectNumber: `DLD-FIX-${2000 + i}`,
        escrowAccountConfirmed: i % 7 !== 6,
        oqoodEligible: true,
        freehold: true,
        serviceChargeEstimateAEDPerSqft: 12 + (i % 9),
        assignmentAllowed: i % 3 !== 2,
        assignmentMinPaidPct: i % 3 !== 2 ? 30 + (i % 3) * 10 : undefined,
        developerNocFeeAED: 5000 + (i % 4) * 2500,
        alcazarStatus,
        alcazarVerdict: rt(
          alcazarStatus === "declined"
            ? `Declined at review. Fixture verdict for ${name}: the exit could not be written, so the entry was not written.`
            : `Fixture verdict for ${name}, ${community.name}: ${plan.label} plan against a ${quarter} ${handoverYear} handover, entry from AED ${priceFrom.toLocaleString()}. Replace with the real written view before launch.`,
        ),
        alcazarFilterScores: {
          developerRecord: score(1, 1),
          regulatoryStanding: score(2, 2),
          priceVsComparables: score(0, 3),
          paymentStructure: score(1, 4),
          supplyInWindow: score(2, 5),
          exitTerms: score(0, 6),
          runningCost: score(1, 7),
          unitQuality: score(2, 8),
        },
        ...(alcazarStatus === "declined"
          ? {
              declineReason:
                "Failed on price vs comparables and exit terms at review date. Fixture text.",
              declinePublic: i % 3 === 2,
            }
          : {}),
        mortgageable: (["yes", "at-handover-only", "unknown", "yes"] as const)[i % 4],
        lendersFinancing: [lenderIds[i % lenderIds.length], lenderIds[(i + 2) % lenderIds.length]],
        mediaLicence: published ? "developer-supplied" : "unlicensed",
        ...(published
          ? {
              mediaLicenceNote: "Fixture — developer pack, logged 2026-08-01",
              trakheesiPermitNumber: `TRK-FIX-${7000 + i}`,
              publishedAt: new Date(2026, (i % 7), 1 + (i % 27)).toISOString(),
            }
          : {}),
        editorialOrder: i,
        isFixture: true,
        unitTypes: Array.from({ length: 1 + (i % 3) }, (_, u) => ({
          label: u === 0 ? (bedsMin === 0 ? "Studio" : `${bedsMin} BR`) : `${bedsMin + u} BR`,
          bedrooms: bedsMin + u,
          bathrooms: bedsMin + u + 1,
          sizeSqftMin: sizeFrom + u * 350,
          sizeSqftMax: sizeFrom + u * 350 + 220,
          priceFromAED: priceFrom + u * 450_000,
          availability: (["available", "limited", "sold-out"] as const)[(i + u) % 3],
        })),
      },
    });
    created++;
  }

  const ARTICLES = [
    {
      slug: "non-resident-mortgage-what-actually-binds",
      title: "Non-resident borrowing: the cap is rarely what stops you",
      category: "mortgage" as const,
      excerpt:
        "Most non-resident buyers plan around the 60% LTV ceiling. In practice the debt-burden ratio binds first more often than not.",
      faq: [
        { q: "Do I need UAE residency to borrow?", a: "No. Several banks lend to non-residents against completed property." },
        { q: "What deposit should I plan for?", a: "40–50% of price plus roughly 8% in fees." },
      ],
    },
    {
      slug: "supply-in-window-the-test-nobody-runs",
      title: "Supply in window: the test nobody runs",
      category: "market" as const,
      excerpt:
        "Your exit competes with every unit completing in the same community within a year either side of handover. Here is how we count it.",
      faq: [],
    },
    {
      slug: "reading-a-payment-plan-properly",
      title: "How to read a payment plan properly",
      category: "guide" as const,
      excerpt:
        "40/60 and 80/20 are not variations on a theme. They are different risk products. What each one does to your capital.",
      faq: [],
    },
  ];

  const agentDocs = await payload.find({ collection: "agents", limit: 1, sort: "slug" });
  const shortlisted = await payload.find({
    collection: "projects",
    where: { alcazarStatus: { equals: "shortlisted" } },
    limit: 3,
    depth: 0,
  });

  for (const [i, a] of ARTICLES.entries()) {
    await payload.create({
      collection: "articles",
      data: {
        slug: a.slug,
        title: a.title,
        category: a.category,
        excerpt: a.excerpt,
        body: rt(
          `${a.excerpt} Fixture article body — replaced with real editorial before launch. Every word we publish is written by the desk, never generated from a competitor's text.`,
        ),
        author: agentDocs.docs[0]?.id,
        isFixture: true,
        publishedAt: new Date(2026, 6, 10 + i * 5).toISOString(),
        relatedProjects: shortlisted.docs.map((p) => p.id),
        faq: a.faq,
      },
    });
  }

  await payload.updateGlobal({
    slug: "site-stats",
    data: {
      reviewsTracked: true,
      launchesReviewedThisYear: 184,
      reachedShortlistThisYear: 23,
      marketStats: [
        { value: "AED 142B", label: "Dubai off-plan sales, H1", source: "Fixture — replace with DLD figure", asOf: "2026-07-01" },
        { value: "61%", label: "Off-plan share of transactions", source: "Fixture — replace with DLD figure", asOf: "2026-07-01" },
        { value: "24,300", label: "Units handed over YTD", source: "Fixture — replace with DLD figure", asOf: "2026-07-01" },
      ],
    },
  });

  console.log(
    `Seeded: ${COMMUNITIES.length} communities, ${DEVELOPERS.length} developers, ${LENDERS.length} lenders, ${AGENTS.length} agents, ${created} projects, ${ARTICLES.length} articles.`,
  );
  process.exit(0);
};

seed().catch((err) => {
  console.dir(err?.data ?? err, { depth: 8 });
  process.exit(1);
});
