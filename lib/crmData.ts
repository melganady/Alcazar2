import { getPayloadClient } from "@/lib/payload";
import { PIPELINE_STAGES } from "@/payload/collections/crmShared";
import type { Lead, User, LeadNote, LeadTask, LeadActivity } from "@/payload-types";
import type { Where } from "payload";

/**
 * Alcázar CRM — every read in here explicitly passes `overrideAccess: false`
 * and the current user. That is the one line standing between "an agent
 * sees their assigned leads" and "an agent sees everyone's leads" — Payload's
 * Local API bypasses access control by default, so this file exists to make
 * that impossible to forget on a page-by-page basis.
 */

export type CrmUser = Pick<User, "id" | "name" | "email" | "role">;

export async function findLeads({
  user,
  where,
  sort = "-createdAt",
  limit = 100,
  page = 1,
}: {
  user: CrmUser;
  where?: Where;
  sort?: string;
  limit?: number;
  page?: number;
}) {
  const payload = await getPayloadClient();
  return payload.find({
    collection: "leads",
    where,
    sort,
    limit,
    page,
    depth: 1,
    overrideAccess: false,
    user: user as User,
  });
}

export async function findLeadById({ user, id }: { user: CrmUser; id: number }): Promise<Lead | null> {
  const payload = await getPayloadClient();
  try {
    return await payload.findByID({
      collection: "leads",
      id,
      depth: 1,
      overrideAccess: false,
      user: user as User,
    });
  } catch {
    return null;
  }
}

/** One count per pipeline stage — small, fixed list, so N queries beats a groupBy. */
export async function countLeadsByStage({ user }: { user: CrmUser }): Promise<Record<string, number>> {
  const payload = await getPayloadClient();
  const entries = await Promise.all(
    PIPELINE_STAGES.map(async (s) => {
      const res = await payload.count({
        collection: "leads",
        where: { pipelineStage: { equals: s.value } },
        overrideAccess: false,
        user: user as User,
      });
      return [s.value, res.totalDocs] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function listNotes({ user, leadId }: { user: CrmUser; leadId: number }): Promise<LeadNote[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "lead-notes",
    where: { lead: { equals: leadId } },
    sort: "-createdAt",
    limit: 100,
    depth: 1,
    overrideAccess: false,
    user: user as User,
  });
  return res.docs;
}

export async function listTasks({ user, leadId }: { user: CrmUser; leadId: number }): Promise<LeadTask[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "lead-tasks",
    where: { lead: { equals: leadId } },
    sort: "-createdAt",
    limit: 100,
    depth: 1,
    overrideAccess: false,
    user: user as User,
  });
  return res.docs;
}

export async function listActivity({ user, leadId }: { user: CrmUser; leadId: number }): Promise<LeadActivity[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "lead-activity",
    where: { lead: { equals: leadId } },
    sort: "-createdAt",
    limit: 200,
    depth: 1,
    overrideAccess: false,
    user: user as User,
  });
  return res.docs;
}

export async function listMyTasks({ user }: { user: CrmUser }): Promise<LeadTask[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "lead-tasks",
    where: { assignedTo: { equals: user.id } },
    sort: "dueDate",
    limit: 200,
    depth: 1,
    overrideAccess: false,
    user: user as User,
  });
  return res.docs;
}

/** For assignment dropdowns — every team member, not access-filtered by role (any staff member can see who's on the team). */
export async function listTeam({ user }: { user: CrmUser }): Promise<User[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "users",
    sort: "name",
    limit: 200,
    overrideAccess: false,
    user: user as User,
  });
  return res.docs;
}
