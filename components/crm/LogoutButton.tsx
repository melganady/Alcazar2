"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      await fetch("/api/users/logout", { method: "POST", credentials: "include" });
    } finally {
      router.push("/crm/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="type-eyebrow text-iron/80 transition-colors duration-fast ease-brand hover:text-iron hover:underline underline-offset-4"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
