import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Button } from "@/components/primitives/Button";
import { Tag } from "@/components/primitives/Tag";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { Rule } from "@/components/primitives/Rule";
import { CropMarks } from "@/components/primitives/CropMarks";
import { StatBlock } from "@/components/primitives/StatBlock";
import { Logo, Monogram } from "@/components/primitives/Logo";
import { StyleguideDemos } from "./StyleguideDemos";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

const SWATCHES = [
  {
    token: "--iron-grey",
    hex: "#3F4244",
    cls: "bg-iron",
    use: "The signature. Wordmark, headlines, full fields, and all body text — the palette's only dark.",
  },
  {
    token: "--ash-wood",
    hex: "#D7D1C6",
    cls: "bg-ash",
    use: "The warm ground. Framed fields, reversed type, stationery.",
  },
  {
    token: "--pine-smoke",
    hex: "#8A937F",
    cls: "bg-pine",
    use: "The one accent. Rules, tags, quiet emphasis — one per composition. Never carries text.",
  },
  {
    token: "--nordic-linen",
    hex: "#EDEAE3",
    cls: "bg-linen border border-rule",
    use: "Digital surfaces. Cards, panels, tables.",
  },
  {
    token: "--frost-white",
    hex: "#F7F7F5",
    cls: "bg-frost border border-rule",
    use: "The primary page ground.",
  },
] as const;

const TYPE_SPECIMENS = [
  { cls: "type-display-xl", name: "display-xl", spec: "Jost 300 · 64→34 · +0.20em · hero wordmark only" },
  { cls: "type-display-l", name: "display-l", spec: "Jost 300 · 44→28 · +0.14em · page titles" },
  { cls: "type-display-m", name: "display-m", spec: "Jost 500 · 28→21 · +0.10em · section headings" },
  { cls: "type-display-s", name: "display-s", spec: "Jost 500 · 17→15 · +0.08em · card titles" },
  { cls: "type-eyebrow", name: "eyebrow", spec: "Jost 400 · 11→10 · +0.28em · labels, kickers" },
  { cls: "type-body-l", name: "body-l", spec: "Montserrat 300 · 18→16 · lead paragraphs" },
  { cls: "type-body", name: "body", spec: "Montserrat 300 · 15→14 · default" },
  { cls: "type-body-s", name: "body-s", spec: "Montserrat 300 · 13→12 · captions, table cells" },
  { cls: "type-micro", name: "micro", spec: "Montserrat 400 · 11→10 · legal, footnotes" },
] as const;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-8 border-t border-rule py-14">
      <h2 className="type-display-m text-iron">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleguidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-container px-4 py-16 md:px-6">
      <header className="flex flex-col gap-4 pb-14">
        <Eyebrow>Alcázar design system · Phase 1</Eyebrow>
        <h1 className="type-display-l text-iron">Styleguide</h1>
        <p className="type-body-l max-w-2xl text-iron/80">
          Every token and primitive on one page. This page is documentation —
          the one place multiple pine accents may sit together.
        </p>
      </header>

      <Section title="Colour">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {SWATCHES.map((s) => (
            <div key={s.token} className="flex flex-col gap-3">
              <div className={`h-24 ${s.cls}`} />
              <div className="flex flex-col gap-1">
                <span className="type-eyebrow text-iron">{s.token}</span>
                <span className="type-body-s text-iron/80">{s.hex}</span>
                <span className="type-micro text-iron/80">{s.use}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="type-body-s max-w-2xl text-iron/80">
          Viewport ratio target: linen and frost white 60 · ash wood 25 ·
          iron grey 12 · pine smoke 3. Pine Smoke is the only accent — one rule,
          tag or line per composition. No gradients, no shadows deeper than a
          1px hairline.
        </p>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-7">
          {TYPE_SPECIMENS.map((t) => (
            <div key={t.name} className="flex flex-col gap-1.5">
              <p className={`${t.cls} text-iron`}>The address before it exists</p>
              <p className="type-micro text-iron/80">
                .{t.cls} — {t.spec}
              </p>
            </div>
          ))}
        </div>
        <p className="type-body-s max-w-2xl text-iron/80">
          Two fonts, no third. Display is always uppercase and tracked at +8 to
          +14%; text is never tracked. The ar locale swaps display type to IBM
          Plex Sans Arabic with tracking removed — the one permitted exception.
        </p>
      </Section>

      <Section title="Logo">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex items-center justify-center border border-rule bg-ash p-10">
            <Logo />
          </div>
          <div className="flex items-center justify-center bg-iron p-10">
            <Logo reversed />
          </div>
          <div className="flex items-center justify-center gap-6 border border-rule bg-linen p-10">
            <Monogram />
            <Monogram reversed />
          </div>
        </div>
        <p className="type-body-s max-w-2xl text-iron/80">
          Clearspace equals the cap-height of the A, carried as padding on the
          component itself so a parent cannot violate it. Below 120px wide (30mm
          in print), use the monogram. Never stretch it, recolour it outside the
          five-colour palette, add effects, or set it over photography without an
          ash wood, linen or iron field behind it.
        </p>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
        <p className="type-body-s max-w-2xl text-iron/80">
          Jost, uppercase, tracked. Motion: 200–300ms,
          cubic-bezier(0.16, 1, 0.3, 1), colour and 8–16px translation only.
        </p>
      </Section>

      <Section title="Tags, eyebrows, rules">
        <div className="flex flex-wrap items-center gap-4">
          <Tag>Apartment · 1–3 BR</Tag>
          <Tag tone="accent">Shortlisted</Tag>
          <Eyebrow>Payment plan · 60/40</Eyebrow>
        </div>
        <Rule />
      </Section>

      <Section title="Crop marks + stats">
        <CropMarks className="max-w-3xl">
          <div className="grid grid-cols-2 gap-8 bg-linen p-8 md:grid-cols-4">
            <StatBlock value="184" label="Launches reviewed" source="Alcázar, 2026" />
            <StatBlock value="23" label="Reached shortlist" source="Alcázar, 2026" />
            <StatBlock value="60/40" label="Typical plan" />
            <StatBlock value="Q4 2028" label="Handover window" />
          </div>
        </CropMarks>
        <p className="type-body-s max-w-2xl text-iron/80">
          The + corner marks are a signature element for panels. Stat values
          never animate.
        </p>
      </Section>

      <Section title="Forms, overlays, price display">
        <StyleguideDemos />
      </Section>
    </div>
  );
}
