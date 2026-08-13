import type { LeadActivity } from "@/payload-types";

function actorLabel(entry: LeadActivity): string | null {
  if (entry.actor && typeof entry.actor === "object") return entry.actor.name || entry.actor.email;
  return null;
}

export function ActivityFeed({ entries }: { entries: LeadActivity[] }) {
  if (entries.length === 0) {
    return <p className="type-body-s text-iron/80">Nothing yet.</p>;
  }
  return (
    <ol className="flex flex-col gap-3">
      {entries.map((entry) => {
        const actor = actorLabel(entry);
        return (
          <li key={entry.id} className="flex flex-col gap-0.5 border-s-2 border-pine ps-3">
            <span className="type-body-s text-iron">{entry.message}</span>
            <span className="type-micro text-iron/80">
              {actor ? `${actor} · ` : ""}
              {entry.createdAt.slice(0, 16).replace("T", " ")}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
