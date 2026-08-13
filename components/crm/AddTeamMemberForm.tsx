"use client";

import { useRef, useState, useTransition } from "react";
import { createTeamMember } from "@/app/crm/actions";
import { useToast } from "@/components/primitives/Toast";
import { Field } from "@/components/primitives/Field";
import { Select } from "@/components/primitives/Select";
import { Button } from "@/components/primitives/Button";

export function AddTeamMemberForm() {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const data = new FormData(e.currentTarget);
        const name = String(data.get("name") || "").trim();
        const email = String(data.get("email") || "").trim();
        const password = String(data.get("password") || "");
        const role = (data.get("role") === "admin" ? "admin" : "agent") as "admin" | "agent";
        if (!name || !email || password.length < 8) {
          setError("Name, email and an 8+ character temporary password are all required.");
          return;
        }
        startTransition(async () => {
          try {
            await createTeamMember({ name, email, password, role });
            formRef.current?.reset();
            toast(`${name} added — share their temporary password with them directly.`);
          } catch {
            setError("Couldn't add that team member — check the email isn't already in use.");
          }
        });
      }}
      className="grid gap-4 border border-rule bg-linen p-5 sm:grid-cols-2"
    >
      <Field id="tm-name" name="name" label="Name" required />
      <Field id="tm-email" name="email" type="email" label="Email" required />
      <Field id="tm-password" name="password" type="text" label="Temporary password" hint="8+ characters — share it with them directly, not by email." required />
      <Select id="tm-role" name="role" label="Role" defaultValue="agent" options={[{ label: "Agent", value: "agent" }, { label: "Admin", value: "admin" }]} />
      {error ? <p className="type-body-s text-iron sm:col-span-2" role="alert">{error}</p> : null}
      <Button type="submit" disabled={pending} className="sm:col-span-2 sm:w-fit">
        {pending ? "Adding…" : "Add team member"}
      </Button>
    </form>
  );
}
