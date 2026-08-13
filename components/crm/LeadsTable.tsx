import Link from "next/link";
import type { Lead } from "@/payload-types";
import { StageSelect, ClaimButton } from "./LeadStageControl";

function sourceLabel(lead: Lead): string {
  if (lead.sourceProject && typeof lead.sourceProject === "object") return lead.sourceProject.name;
  return lead.sourcePage || "General enquiry";
}

function agentLabel(lead: Lead): string {
  if (lead.assignedAgent && typeof lead.assignedAgent === "object") {
    return lead.assignedAgent.name || lead.assignedAgent.email;
  }
  return "Unassigned";
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <p className="type-body-s border border-rule bg-linen p-8 text-center text-iron/80">
        No leads match these filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-rule bg-linen">
      <table className="w-full min-w-[52rem] border-collapse">
        <thead>
          <tr className="border-b-2 border-pine">
            {["Name", "Contact", "Source", "Stage", "Agent", "Received", ""].map((h) => (
              <th key={h} className="type-eyebrow p-3 text-start text-iron/80">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-rule/60">
              <td className="type-body-s p-3 font-medium text-iron">
                <Link href={`/crm/leads/${lead.id}`} className="hover:underline underline-offset-4">
                  {lead.name}
                </Link>
              </td>
              <td className="type-body-s p-3 text-iron/80">
                {lead.email || "—"}
                {lead.phone ? <div>{lead.phone}</div> : null}
              </td>
              <td className="type-body-s p-3 text-iron">{sourceLabel(lead)}</td>
              <td className="p-3">
                <StageSelect leadId={lead.id} stage={lead.pipelineStage} />
              </td>
              <td className="type-body-s p-3 text-iron">{agentLabel(lead)}</td>
              <td className="type-body-s p-3 text-iron/80">{lead.createdAt.slice(0, 10)}</td>
              <td className="p-3">
                {lead.assignedAgent ? (
                  <Link href={`/crm/leads/${lead.id}`} className="type-eyebrow text-iron/80 hover:text-iron hover:underline underline-offset-4">
                    Open
                  </Link>
                ) : (
                  <ClaimButton leadId={lead.id} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
