"use client";

import { useRef, useTransition } from "react";
import { addNote } from "@/app/crm/actions";
import { useToast } from "@/components/primitives/Toast";
import { Button } from "@/components/primitives/Button";

export function NoteForm({ leadId }: { leadId: number }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const body = new FormData(e.currentTarget).get("body");
        if (!body || typeof body !== "string" || !body.trim()) return;
        startTransition(async () => {
          try {
            await addNote(leadId, body);
            formRef.current?.reset();
          } catch {
            toast("Couldn't save the note — try again.");
          }
        });
      }}
      className="flex flex-col gap-3"
    >
      <textarea
        name="body"
        required
        rows={3}
        placeholder="Add a note…"
        className="type-body w-full border border-rule bg-linen px-3.5 py-2.5 text-iron placeholder:text-iron/80 transition-colors duration-fast ease-brand focus:border-iron"
      />
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Add note"}
      </Button>
    </form>
  );
}
