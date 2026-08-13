"use client";

import { useTransition, type DragEvent } from "react";
import Link from "next/link";
import { updateLeadStage } from "@/app/crm/actions";
import { useToast } from "@/components/primitives/Toast";
import { PIPELINE_STAGES, type PipelineStage } from "@/payload/collections/crmShared";
import type { Lead } from "@/payload-types";
import { StageSelect } from "./LeadStageControl";

function sourceLabel(lead: Lead): string {
  if (lead.sourceProject && typeof lead.sourceProject === "object") return lead.sourceProject.name;
  return lead.sourcePage || "General enquiry";
}

function agentLabel(lead: Lead): string {
  if (lead.assignedAgent && typeof lead.assignedAgent === "object") {
    return lead.assignedAgent.name || lead.assignedAgent.email;
  }
  return "Unclaimed";
}

/**
 * Drag-to-move works with a mouse (native HTML5 DnD, no new dependency) —
 * a bonus for desktop. It is deliberately not the only way to change a
 * stage: every card also carries the same accessible <select> the table
 * view uses, which is what touch, keyboard and screen-reader use actually
 * relies on.
 */
export function LeadsKanban({ leads }: { leads: Lead[] }) {
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  function onDrop(e: DragEvent<HTMLDivElement>, stage: PipelineStage) {
    e.preventDefault();
    const leadId = Number(e.dataTransfer.getData("text/lead-id"));
    if (!leadId) return;
    startTransition(async () => {
      try {
        await updateLeadStage(leadId, stage);
      } catch {
        toast("Couldn't move that lead — try again.");
      }
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const column = leads.filter((l) => l.pipelineStage === stage.value);
        return (
          <div
            key={stage.value}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, stage.value)}
            className="flex w-72 shrink-0 flex-col gap-3 border border-rule bg-linen p-3"
          >
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <span className="type-eyebrow text-iron">{stage.label}</span>
              <span className="type-micro text-iron/80">{column.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {column.length === 0 ? (
                <p className="type-micro text-iron/80">Nothing here.</p>
              ) : (
                column.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/lead-id", String(lead.id))}
                    className="flex flex-col gap-2 border border-rule bg-frost p-3 cursor-grab active:cursor-grabbing"
                  >
                    <Link href={`/crm/leads/${lead.id}`} className="type-body-s font-medium text-iron hover:underline underline-offset-4">
                      {lead.name}
                    </Link>
                    <p className="type-micro text-iron/80">{sourceLabel(lead)}</p>
                    <p className="type-micro text-iron/80">{agentLabel(lead)}</p>
                    <StageSelect leadId={lead.id} stage={lead.pipelineStage} />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
