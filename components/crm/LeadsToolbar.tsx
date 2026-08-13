"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select } from "@/components/primitives/Select";

type Option = { label: string; value: string };

export function LeadsToolbar({
  stages,
  countries,
  team,
}: {
  stages: Option[];
  countries: Option[];
  team: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  const view = searchParams.get("view") === "kanban" ? "kanban" : "table";

  return (
    <div className="flex flex-wrap items-end gap-4 border-b border-rule pb-6">
      <Select
        id="filter-stage"
        label="Stage"
        options={[{ label: "All stages", value: "" }, ...stages]}
        value={searchParams.get("stage") ?? ""}
        onChange={(e) => setParam("stage", e.target.value)}
        className="w-48"
      />
      <Select
        id="filter-agent"
        label="Agent"
        options={[{ label: "Everyone", value: "" }, { label: "Unassigned", value: "unassigned" }, ...team]}
        value={searchParams.get("agent") ?? ""}
        onChange={(e) => setParam("agent", e.target.value)}
        className="w-48"
      />
      <Select
        id="filter-market"
        label="Market"
        options={[{ label: "All markets", value: "" }, ...countries]}
        value={searchParams.get("market") ?? ""}
        onChange={(e) => setParam("market", e.target.value)}
        className="w-48"
      />
      <div className="ms-auto flex gap-2">
        <button
          type="button"
          onClick={() => setParam("view", "table")}
          className={`type-eyebrow border px-4 py-2.5 transition-colors duration-fast ease-brand ${view === "table" ? "border-iron bg-iron text-ash" : "border-rule text-iron/80 hover:border-iron"}`}
        >
          Table
        </button>
        <button
          type="button"
          onClick={() => setParam("view", "kanban")}
          className={`type-eyebrow border px-4 py-2.5 transition-colors duration-fast ease-brand ${view === "kanban" ? "border-iron bg-iron text-ash" : "border-rule text-iron/80 hover:border-iron"}`}
        >
          Kanban
        </button>
      </div>
    </div>
  );
}
