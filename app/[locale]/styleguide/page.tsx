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
    token: "--rein-navy",
    hex: "#050A30",
    cls: "bg-navy",
    use: "REIN Navy. The signature: wordmark, headlines, full fields. Taken from the logo artwork and never adjusted.",
  },
  {
    token: "--steel",
    hex: "#5980A6",
    cls: "bg-steel",
    use: "The one accent. Rules, tags, quiet emphasis. Tuned for chrome and large type — paragraph text uses steel-700 or deeper.",
  },
  {
    token: "--paper",
    hex: "#F2F2F3",
    cls: "bg-paper border border-rule",
    use: "The ground. Default for every page and every document.",
  },
  {
    token: "--graphite",
    hex: "#2B2B2D",
    cls: "bg-graphite",
    use: "Body copy at rest, and the ink behind the rules.",
  },
  {
    token: "--surface",
    hex: "#E9E9EA",
    cls: "bg-surface border border-rule",
    use: "Digital surfaces. Cards, panels, tables.",
  },
  {
    token: "--chalk",
    hex: "#F7F7F8",
    cls: "bg-chalk border border-rule",
    use: "Reversed type on the navy field.",
  },
] as const;

const TYPE_SPECIMENS = [
  { cls: "type-display-xl", name: "display-xl", spec: "Barlow Condensed 600 · 78→40 · −0.015em · hero" },
  { cls: "type-display-l", name: "display-l", spec: "Barlow Condensed 600 · 52→32 · −0.012em · page titles" },
  { cls: "type-display-m", name: "display-m", spec: "Barlow Condensed 600 · 32→24 · −0.008em · section headings" },
  { cls: "type-display-s", name: "display-s", spec: "Barlow Condensed 600 · 22→18 · −0.004em · card titles" },
  { cls: "type-eyebrow", name: "eyebrow", spec: "Barlow Condensed 500 · 12→11 · +0.16em · uppercase kickers" },
  { cls: "type-body-l", name: "body-l", spec: "Barlow 400 · 19→16 · lead paragraphs" },
  { cls: "type-body", name: "body", spec: "Barlow 400 · 16→15 · default" },
  { cls: "type-body-s", name: "body-s", spec: "Barlow 400 · 14→13 · captions, table cells" },
  { cls: "type-micro", name: "micro", spec: "Barlow 400 · 12→11 · legal, footnotes" },
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
      <h2 className="type-display-m text-navy">{title}</h2>
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
        <Eyebrow>REIN Investment design system · Phase 1</Eyebrow>
        <h1 className="type-display-l text-navy">Styleguide</h1>
        <p className="type-body-l max-w-2xl text-navy/80">
          Every token and primitive on one page. This page is documentation —
          the one place multiple steel accents may sit together.
        </p>
      </header>

      <Section title="Colour">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SWATCHES.map((s) => (
            <div key={s.token} className="flex flex-col gap-3">
              <div className={`h-24 ${s.cls}`} />
              <div className="flex flex-col gap-1">
                <span className="type-eyebrow text-navy">{s.token}</span>
                <span className="type-body-s text-navy/80">{s.hex}</span>
                <span className="type-micro text-navy/80">{s.use}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="type-body-s max-w-2xl text-navy/80">
          Viewport ratio target: paper and surface 60 · navy 25 · graphite 12 ·
          steel 3. Navy field or paper ground, nothing between. Steel is the
          only accent — one rule, tag or line per composition. No gradients, no
          shadows deeper than a 1px hairline.
        </p>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-7">
          {TYPE_SPECIMENS.map((t) => (
            <div key={t.name} className="flex flex-col gap-1.5">
              <p className={`${t.cls} text-navy`}>Fresh thinking, real income</p>
              <p className="type-micro text-navy/80">
                .{t.cls} — {t.spec}
              </p>
            </div>
          ))}
        </div>
        <p className="type-body-s max-w-2xl text-navy/80">
          Two fonts, no third. Display is set in sentence case and lightly
          tightened — the condensed face carries the emphasis, so headings are
          never shouted in tracked capitals. The uppercase kicker is the one
          tracked style left, and text is never tracked. The ar locale swaps
          display type to IBM Plex Sans Arabic with tracking removed — the one
          permitted exception.
        </p>
      </Section>

      <Section title="Logo">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex items-center justify-center border border-rule bg-chalk p-10">
            <Logo />
          </div>
          <div className="flex items-center justify-center bg-navy p-10">
            <Logo reversed />
          </div>
          <div className="flex items-center justify-center gap-6 border border-rule bg-surface p-10">
            <Monogram />
            <Monogram reversed />
          </div>
        </div>
        <p className="type-body-s max-w-2xl text-navy/80">
          The wordmark is supplied artwork and is never re-typed: REIN stacks
          over Investment against a single full-height stem. Clear space equals
          the stem&rsquo;s width &times; 4, carried as padding on the component
          itself so a parent cannot violate it. Below 96px wide (28mm in print),
          use the R mark. Never outline, shadow, gradient or rotate the lockup,
          and never place the navy wordmark on a ground darker than steel-300 —
          reverse it to white instead.
        </p>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
        <p className="type-body-s max-w-2xl text-navy/80">
          Barlow Condensed, uppercase, tracked. Motion: 200–300ms,
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
          <div className="grid grid-cols-2 gap-8 bg-surface p-8 md:grid-cols-4">
            <StatBlock value="184" label="Launches reviewed" source="REIN Investment, 2026" />
            <StatBlock value="23" label="Reached shortlist" source="REIN Investment, 2026" />
            <StatBlock value="60/40" label="Typical plan" />
            <StatBlock value="Q4 2028" label="Handover window" />
          </div>
        </CropMarks>
        <p className="type-body-s max-w-2xl text-navy/80">
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
