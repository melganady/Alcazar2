import type { Metadata } from "next";
import Link from "next/link";
import { StatBlock } from "@/components/primitives/StatBlock";
import { getPayloadClient } from "@/lib/payload";
import { countLeadsByStage, listMyTasks } from "@/lib/crmData";
import { STAGE_LABEL } from "@/payload/collections/crmShared";
import { requireCrmUser } from "../auth";

export const metadata: Metadata = { title: "Dashboard" };

const CLOSED = new Set(["closed-won", "closed-lost"]);

export default async function CrmDashboardPage() {
  const user = await requireCrmUser();
  const payload = await getPayloadClient();

  const [stageCounts, myTasks, liveProjects, secondaryLive] = await Promise.all([
    countLeadsByStage({ user }),
    listMyTasks({ user }),
    payload.count({ collection: "projects", where: { publishedAt: { exists: true } } }),
    payload.count({
      collection: "projects",
      where: { and: [{ publishedAt: { exists: true } }, { listingType: { equals: "secondary" } }] },
    }),
  ]);

  const openLeads = Object.entries(stageCounts).reduce(
    (sum, [stage, count]) => (CLOSED.has(stage) ? sum : sum + count),
    0,
  );
  const today = new Date().toISOString().slice(0, 10);
  const openTasks = myTasks.filter((t) => !t.done);
  const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate.slice(0, 10) < today);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="type-eyebrow text-iron/80">Alcázar CRM</p>
        <h1 className="type-display-m text-iron">Good to see you, {user.name || user.email}.</h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock value={String(openLeads)} label="Open leads" />
        <StatBlock value={String(stageCounts.new ?? 0)} label="New — unclaimed" />
        <StatBlock value={String(openTasks.length)} label="My open tasks" />
        <StatBlock value={String(overdueTasks.length)} label="Overdue tasks" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatBlock value={String(liveProjects.totalDocs)} label="Live listings" source={`of which ${secondaryLive.totalDocs} secondary`} />
        {(["contacted", "qualified", "viewing-scheduled", "offer-made"] as const).map((stage) => (
          <StatBlock key={stage} value={String(stageCounts[stage] ?? 0)} label={STAGE_LABEL[stage]} />
        ))}
      </div>

      <div className="flex flex-wrap gap-4 border-t border-rule pt-6">
        <Link href="/crm/leads?stage=new" className="type-eyebrow border border-iron px-6 py-3.5 text-iron transition-colors duration-fast ease-brand hover:bg-iron hover:text-ash">
          Claim a new lead
        </Link>
        <Link href="/crm/tasks" className="type-eyebrow border border-rule px-6 py-3.5 text-iron transition-colors duration-fast ease-brand hover:border-iron">
          My tasks
        </Link>
      </div>
    </div>
  );
}
