import { headers as getHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { getPayloadClient } from "@/lib/payload";
import type { CrmUser } from "@/lib/crmData";

/**
 * Alcázar CRM auth — reuses the Payload `users` cookie session (the same
 * one /admin already sets on login) rather than a second auth system.
 * `payload.auth({ headers })` reads and verifies that cookie/JWT.
 */
export async function getCrmUser(): Promise<CrmUser | null> {
  const payload = await getPayloadClient();
  const headers = await getHeaders();
  const { user } = await payload.auth({ headers });
  if (!user) return null;
  return { id: user.id, name: user.name ?? null, email: user.email, role: user.role } as CrmUser;
}

export async function requireCrmUser(): Promise<CrmUser> {
  const user = await getCrmUser();
  if (!user) redirect("/crm/login");
  return user;
}

export async function requireAdmin(): Promise<CrmUser> {
  const user = await requireCrmUser();
  if (user.role !== "admin") redirect("/crm");
  return user;
}
