"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/app/crm/actions";
import { useToast } from "@/components/primitives/Toast";

export function RoleSelect({ userId, role, disabled }: { userId: number; role: string; disabled?: boolean }) {
  const { toast } = useToast();
  const [value, setValue] = useState(role);
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={value}
      disabled={pending || disabled}
      onChange={(e) => {
        const next = e.target.value as "admin" | "agent";
        const prev = value;
        setValue(next);
        startTransition(async () => {
          try {
            await updateUserRole(userId, next);
          } catch {
            setValue(prev);
            toast("Couldn't change that role — try again.");
          }
        });
      }}
      className="type-body-s w-40 appearance-none border border-rule bg-linen px-2.5 py-1.5 text-iron transition-colors duration-fast ease-brand focus:border-iron disabled:opacity-40"
    >
      <option value="admin">Admin</option>
      <option value="agent">Agent</option>
    </select>
  );
}
