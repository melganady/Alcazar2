"use client";

import { useState, useTransition } from "react";
import { reassignLead } from "@/app/crm/actions";
import { useToast } from "@/components/primitives/Toast";

export function AssignSelect({
  leadId,
  assignedAgentId,
  team,
}: {
  leadId: number;
  assignedAgentId: number | null;
  team: Array<{ id: number; label: string }>;
}) {
  const { toast } = useToast();
  const [value, setValue] = useState(assignedAgentId ? String(assignedAgentId) : "");
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        const prev = value;
        setValue(next);
        startTransition(async () => {
          try {
            await reassignLead(leadId, next ? Number(next) : null);
          } catch {
            setValue(prev);
            toast("Couldn't change the assignment — try again.");
          }
        });
      }}
      className="type-body w-full appearance-none border border-rule bg-linen px-3.5 py-2.5 text-iron transition-colors duration-fast ease-brand focus:border-iron"
    >
      <option value="">Unassigned</option>
      {team.map((t) => (
        <option key={t.id} value={t.id}>
          {t.label}
        </option>
      ))}
    </select>
  );
}
