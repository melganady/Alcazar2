import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/primitives/Logo";
import { LoginForm } from "@/components/crm/LoginForm";
import { getCrmUser } from "../auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function CrmLoginPage() {
  // Already signed in — no reason to show the form again.
  const user = await getCrmUser();
  if (user) redirect("/crm");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-4">
      <div className="flex flex-col items-center gap-1">
        <Logo />
        <p className="type-eyebrow text-iron/80">CRM</p>
      </div>
      <LoginForm />
    </div>
  );
}
