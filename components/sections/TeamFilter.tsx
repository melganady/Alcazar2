"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

export type TeamMember = {
  id: string;
  slug: string;
  name: string;
  role: string;
  brn: string;
  languages: string[];
  specialisms: string[];
  bio: string | null;
  whatsapp: string | null;
  email: string | null;
};

/** §6 /team — filterable by language and specialism. */
export function TeamFilter({ agents }: { agents: TeamMember[] }) {
  const [language, setLanguage] = useState<string | null>(null);
  const [specialism, setSpecialism] = useState<string | null>(null);

  const languages = useMemo(
    () => [...new Set(agents.flatMap((a) => a.languages))].sort(),
    [agents],
  );
  const specialisms = useMemo(
    () => [...new Set(agents.flatMap((a) => a.specialisms))].sort(),
    [agents],
  );

  const visible = agents.filter(
    (a) =>
      (!language || a.languages.includes(language)) &&
      (!specialism || a.specialisms.includes(specialism)),
  );

  const Chip = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "type-micro border px-3 py-1.5 uppercase transition-colors duration-fast ease-brand",
        active ? "border-blue bg-blue text-sand" : "border-rule text-midnight/70 hover:border-blue hover:text-blue",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="type-eyebrow me-2 text-midnight/50">Language</span>
          {languages.map((l) => (
            <Chip
              key={l}
              label={l}
              active={language === l}
              onClick={() => setLanguage(language === l ? null : l)}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="type-eyebrow me-2 text-midnight/50">Specialism</span>
          {specialisms.map((s) => (
            <Chip
              key={s}
              label={s}
              active={specialism === s}
              onClick={() => setSpecialism(specialism === s ? null : s)}
            />
          ))}
        </div>
      </div>

      <p aria-live="polite" className="type-eyebrow text-midnight/60">
        {visible.length} {visible.length === 1 ? "consultant" : "consultants"}
      </p>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((a) => (
          <article key={a.id} className="flex flex-col gap-2 border border-rule bg-white p-5">
            <div className="flex h-14 w-14 items-center justify-center bg-blue font-display text-display-s text-sand">
              {a.name.charAt(0)}
            </div>
            <h2 className="type-display-s mt-2 text-midnight">{a.name}</h2>
            <p className="type-body-s text-midnight/70">{a.role}</p>
            <p className="type-micro text-midnight/50">RERA BRN {a.brn}</p>
            {a.bio ? <p className="type-body-s mt-1 text-midnight/80">{a.bio}</p> : null}
            <p className="type-micro mt-1 text-midnight/60">{a.languages.join(" · ")}</p>
            <p className="type-micro text-midnight/60">{a.specialisms.join(" · ")}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {a.whatsapp ? (
                <a
                  href={`https://wa.me/${a.whatsapp.replace(/[^\d]/g, "")}`}
                  className="type-eyebrow bg-blue px-4 py-2.5 text-sand transition-colors duration-fast ease-brand hover:bg-midnight"
                >
                  WhatsApp
                </a>
              ) : null}
              {a.email ? (
                <a
                  href={`mailto:${a.email}`}
                  className="type-eyebrow border border-blue px-4 py-2.5 text-blue transition-colors duration-fast ease-brand hover:bg-blue hover:text-sand"
                >
                  Email
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
