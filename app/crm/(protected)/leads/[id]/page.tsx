import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findLeadById, listNotes, listTasks, listActivity, listTeam } from "@/lib/crmData";
import { absolute } from "@/lib/seo";
import { StageSelect } from "@/components/crm/LeadStageControl";
import { AssignSelect } from "@/components/crm/AssignSelect";
import { NoteForm } from "@/components/crm/NoteForm";
import { TaskForm } from "@/components/crm/TaskForm";
import { TaskItem } from "@/components/crm/TaskItem";
import { ActivityFeed } from "@/components/crm/ActivityFeed";
import { requireCrmUser } from "../../../auth";

export const metadata: Metadata = { title: "Lead" };

export default async function CrmLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCrmUser();
  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isFinite(leadId)) notFound();

  const lead = await findLeadById({ user, id: leadId });
  if (!lead) {
    // Either the lead doesn't exist, or — for an agent — it belongs to
    // someone else. Same message either way: nothing to probe.
    return (
      <div className="flex flex-col gap-4">
        <p className="type-body-s text-iron/80">
          This lead doesn&apos;t exist, or isn&apos;t assigned to you.
        </p>
        <Link href="/crm/leads" className="type-eyebrow text-iron underline underline-offset-4">
          ← Back to leads
        </Link>
      </div>
    );
  }

  const [notes, tasks, activity, team] = await Promise.all([
    listNotes({ user, leadId }),
    listTasks({ user, leadId }),
    listActivity({ user, leadId }),
    listTeam({ user }),
  ]);

  const teamOptions = team.map((t) => ({ id: t.id, label: t.name || t.email }));
  const source =
    lead.sourceProject && typeof lead.sourceProject === "object" ? lead.sourceProject : null;
  const assignedAgentId =
    lead.assignedAgent && typeof lead.assignedAgent === "object" ? lead.assignedAgent.id : lead.assignedAgent ?? null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/crm/leads" className="type-eyebrow text-iron/80 hover:text-iron hover:underline underline-offset-4">
          ← Leads
        </Link>
        <h1 className="type-display-m text-iron">{lead.name}</h1>
        <p className="type-body-s text-iron/80">
          Received {lead.createdAt.slice(0, 16).replace("T", " ")} · {(lead.locale || "en").toUpperCase()}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3 border border-rule bg-linen p-5">
            <p className="type-eyebrow text-iron/80">Contact</p>
            {lead.email ? (
              <a href={`mailto:${lead.email}`} className="type-body text-iron hover:underline underline-offset-4">
                {lead.email}
              </a>
            ) : null}
            {lead.phone ? (
              <a href={`tel:${lead.phone}`} className="type-body text-iron hover:underline underline-offset-4">
                {lead.phone}
              </a>
            ) : null}
            {!lead.email && !lead.phone ? <p className="type-body-s text-iron/80">No contact details captured.</p> : null}
            {lead.message ? (
              <p className="type-body-s whitespace-pre-wrap border-t border-rule pt-3 text-iron">{lead.message}</p>
            ) : null}
            <dl className="grid grid-cols-2 gap-2 border-t border-rule pt-3">
              {lead.budgetBandAED ? (
                <>
                  <dt className="type-micro text-iron/80">Budget</dt>
                  <dd className="type-body-s text-iron">{lead.budgetBandAED} AED</dd>
                </>
              ) : null}
              {lead.residencyStatus ? (
                <>
                  <dt className="type-micro text-iron/80">Residency</dt>
                  <dd className="type-body-s text-iron">{lead.residencyStatus}</dd>
                </>
              ) : null}
              {lead.purpose ? (
                <>
                  <dt className="type-micro text-iron/80">Purpose</dt>
                  <dd className="type-body-s text-iron">{lead.purpose}</dd>
                </>
              ) : null}
              <dt className="type-micro text-iron/80">Source</dt>
              <dd className="type-body-s text-iron">
                {source ? (
                  <a href={absolute(`/projects/${source.slug}`)} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4">
                    {source.name} ↗
                  </a>
                ) : (
                  lead.sourcePage || "General enquiry"
                )}
              </dd>
            </dl>
          </section>

          <section className="flex flex-col gap-4">
            <p className="type-eyebrow text-iron/80">Notes</p>
            <NoteForm leadId={lead.id} />
            {notes.length === 0 ? (
              <p className="type-body-s text-iron/80">No notes yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {notes.map((note) => {
                  const author = typeof note.author === "object" ? note.author?.name || note.author?.email : null;
                  return (
                    <li key={note.id} className="border-b border-rule/60 pb-3">
                      <p className="type-body-s whitespace-pre-wrap text-iron">{note.body}</p>
                      <p className="type-micro mt-1 text-iron/80">
                        {author ?? "—"} · {note.createdAt.slice(0, 16).replace("T", " ")}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <p className="type-eyebrow text-iron/80">Tasks</p>
            <TaskForm leadId={lead.id} team={teamOptions.map((t) => ({ id: t.id, label: t.label }))} currentUserId={user.id} />
            {tasks.length === 0 ? (
              <p className="type-body-s text-iron/80">No follow-up tasks yet.</p>
            ) : (
              <ul className="flex flex-col">
                {tasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3 border border-rule bg-linen p-5">
            <p className="type-eyebrow text-iron/80">Pipeline</p>
            <StageSelect leadId={lead.id} stage={lead.pipelineStage} />
            <p className="type-eyebrow mt-2 text-iron/80">Assigned to</p>
            <AssignSelect leadId={lead.id} assignedAgentId={assignedAgentId} team={teamOptions} />
          </section>

          <section className="flex flex-col gap-4">
            <p className="type-eyebrow text-iron/80">Activity</p>
            <ActivityFeed entries={activity} />
          </section>
        </div>
      </div>
    </div>
  );
}
