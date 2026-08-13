"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toggleTask } from "@/app/crm/actions";
import { useToast } from "@/components/primitives/Toast";
import type { LeadTask } from "@/payload-types";

function assigneeLabel(task: LeadTask): string {
  if (task.assignedTo && typeof task.assignedTo === "object") {
    return task.assignedTo.name || task.assignedTo.email;
  }
  return "—";
}

export function TaskItem({ task, showLead = false }: { task: LeadTask; showLead?: boolean }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const overdue = !task.done && task.dueDate && task.dueDate.slice(0, 10) < today;

  return (
    <li className="flex items-start gap-3 border-b border-rule/60 py-3">
      <input
        type="checkbox"
        checked={task.done ?? false}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          startTransition(async () => {
            try {
              await toggleTask(task.id, next);
            } catch {
              toast("Couldn't update the task — try again.");
            }
          });
        }}
        className="mt-1 h-4 w-4 shrink-0 accent-iron"
        aria-label={`Mark "${task.title}" ${task.done ? "not done" : "done"}`}
      />
      <div className="flex flex-1 flex-col">
        <span className={`type-body-s text-iron ${task.done ? "line-through opacity-60" : ""}`}>{task.title}</span>
        <span className="type-micro text-iron/80">
          {showLead && task.lead && typeof task.lead === "object" ? (
            <Link href={`/crm/leads/${task.lead.id}`} className="hover:underline underline-offset-4">
              {task.lead.name}
            </Link>
          ) : (
            assigneeLabel(task)
          )}
          {showLead ? ` · ${assigneeLabel(task)}` : ""}
          {task.dueDate ? ` · due ${task.dueDate.slice(0, 10)}` : ""}
          {overdue ? " · overdue" : ""}
        </span>
      </div>
    </li>
  );
}
