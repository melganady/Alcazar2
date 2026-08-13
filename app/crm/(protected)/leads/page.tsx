import type { Metadata } from "next";
import { Suspense } from "react";
import type { Where } from "payload";
import { findLeads, listTeam } from "@/lib/crmData";
import { PIPELINE_STAGES } from "@/payload/collections/crmShared";
import { COUNTRY_OPTIONS } from "@/payload/collections/markets";
import { LeadsToolbar } from "@/components/crm/LeadsToolbar";
import { LeadsTable } from "@/components/crm/LeadsTable";
import { LeadsKanban } from "@/components/crm/LeadsKanban";
import { requireCrmUser } from "../../auth";

export const metadata: Metadata = { title: "Leads" };

export default async function CrmLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireCrmUser();
  const sp = await searchParams;
  const stage = typeof sp.stage === "string" ? sp.stage : "";
  const agent = typeof sp.agent === "string" ? sp.agent : "";
  const market = typeof sp.market === "string" ? sp.market : "";
  const view = sp.view === "kanban" ? "kanban" : "table";

  const and: Where[] = [];
  if (stage) and.push({ pipelineStage: { equals: stage } });
  if (agent === "unassigned") and.push({ assignedAgent: { exists: false } });
  else if (agent) and.push({ assignedAgent: { equals: Number(agent) } });
  // Filters through the sourceProject relationship. Best-effort: if the
  // adapter can't resolve the nested query, it's dropped rather than
  // failing the whole page.
  if (market) and.push({ "sourceProject.country": { equals: market } } as unknown as Where);

  let leads;
  try {
    const where: Where | undefined = and.length > 0 ? { and } : undefined;
    leads = (await findLeads({ user, where, limit: 200 })).docs;
  } catch {
    const fallback = and.filter((clause) => !("sourceProject.country" in (clause as object)));
    const where: Where | undefined = fallback.length > 0 ? { and: fallback } : undefined;
    leads = (await findLeads({ user, where, limit: 200 })).docs;
  }

  const team = await listTeam({ user });
  const teamOptions = team.map((t) => ({ label: t.name || t.email, value: String(t.id) }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="type-eyebrow text-iron/80">Alcázar CRM</p>
        <h1 className="type-display-m text-iron">Leads</h1>
      </div>
      <Suspense fallback={<div className="h-24 border-b border-rule" />}>
        <LeadsToolbar
          stages={PIPELINE_STAGES.map((s) => ({ label: s.label, value: s.value }))}
          countries={COUNTRY_OPTIONS}
          team={teamOptions}
        />
      </Suspense>
      {view === "kanban" ? <LeadsKanban leads={leads} /> : <LeadsTable leads={leads} />}
    </div>
  );
}
