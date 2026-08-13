import { CrmChrome } from "@/components/crm/CrmChrome";
import { requireCrmUser } from "../auth";

/**
 * Everything under this route group requires a session — the one auth
 * check every /crm page inherits. /crm/login sits outside this group so
 * there is no redirect loop.
 */
export default async function CrmProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCrmUser();
  return <CrmChrome user={user}>{children}</CrmChrome>;
}
