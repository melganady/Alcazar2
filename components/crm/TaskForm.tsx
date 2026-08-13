"use client";

import { useRef, useTransition } from "react";
import { addTask } from "@/app/crm/actions";
import { useToast } from "@/components/primitives/Toast";
import { Field } from "@/components/primitives/Field";
import { Select } from "@/components/primitives/Select";
import { Button } from "@/components/primitives/Button";

export function TaskForm({
  leadId,
  team,
  currentUserId,
}: {
  leadId: number;
  team: Array<{ id: number; label: string }>;
  currentUserId: number;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const title = String(data.get("title") || "").trim();
        if (!title) return;
        const dueDate = String(data.get("dueDate") || "");
        const assignedTo = Number(data.get("assignedTo") || currentUserId);
        startTransition(async () => {
          try {
            await addTask(leadId, { title, dueDate: dueDate || undefined, assignedTo });
            formRef.current?.reset();
          } catch {
            toast("Couldn't create the task — try again.");
          }
        });
      }}
      className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
    >
      <Field id="task-title" name="title" label="Follow-up task" placeholder="Call to confirm viewing" required />
      <Field id="task-due" name="dueDate" type="date" label="Due" />
      <Select
        id="task-assignee"
        name="assignedTo"
        label="Assign to"
        defaultValue={String(currentUserId)}
        options={team.map((t) => ({ label: t.label, value: String(t.id) }))}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add task"}
      </Button>
    </form>
  );
}
