"use client";

import { useState, useTransition } from "react";
import { updateLeadStage, claimLead } from "@/app/crm/actions";
import { useToast } from "@/components/primitives/Toast";
import type { PipelineStage } from "@/payload/collections/crmShared";

const STAGES: ReadonlyArray<{ label: string; value: PipelineStage }> = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Viewing scheduled", value: "viewing-scheduled" },
  { label: "Offer made", value: "offer-made" },
  { label: "Closed won", value: "closed-won" },
  { label: "Closed lost", value: "closed-lost" },
];

/** The one reliable, fully accessible way to move a lead — works with a
 * mouse, a keyboard, a screen reader, or a thumb on a phone. Kanban drag
 * is layered on top of this elsewhere as a bonus for desktop mouse users,
 * never as the only way to change a stage. */
export function StageSelect({ leadId, stage }: { leadId: number; stage: string }) {
  const { toast } = useToast();
  const [value, setValue] = useState(stage);
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as PipelineStage;
        const prev = value;
        setValue(next);
        startTransition(async () => {
          try {
            await updateLeadStage(leadId, next);
          } catch {
            setValue(prev);
            toast("Couldn't change the stage — try again.");
          }
        });
      }}
      className="type-body-s w-full appearance-none border border-rule bg-linen px-2.5 py-1.5 text-iron transition-colors duration-fast ease-brand focus:border-iron"
    >
      {STAGES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}

export function ClaimButton({ leadId }: { leadId: number }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await claimLead(leadId);
            toast("Lead claimed.");
          } catch {
            toast("Couldn't claim this lead — try again.");
          }
        })
      }
      className="type-eyebrow border border-iron px-3 py-1.5 text-iron transition-colors duration-fast ease-brand hover:bg-iron hover:text-ash disabled:opacity-40"
    >
      {pending ? "Claiming…" : "Claim"}
    </button>
  );
}
