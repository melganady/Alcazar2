"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/primitives/Field";
import { Button } from "@/components/primitives/Button";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    try {
      // Payload's own REST auth endpoint — it sets the session cookie itself,
      // so there is nothing for the CRM to manage by hand.
      const res = await fetch("/api/users/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") || ""),
          password: String(form.get("password") || ""),
        }),
      });
      if (!res.ok) {
        setError("Incorrect email or password.");
        setPending(false);
        return;
      }
      router.push("/crm");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-5">
      <Field id="email" name="email" type="email" label="Email" required autoComplete="username" />
      <Field id="password" name="password" type="password" label="Password" required autoComplete="current-password" />
      {error ? <p className="type-body-s text-iron" role="alert">{error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
