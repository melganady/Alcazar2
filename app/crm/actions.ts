"use server";

import { revalidatePath } from "next/cache";
import { getPayloadClient } from "@/lib/payload";
import { requireAdmin, requireCrmUser } from "./auth";
import type { PipelineStage } from "@/payload/collections/crmShared";
import type { User } from "@/payload-types";

/**
 * Every mutation below passes `overrideAccess: false` plus the signed-in
 * user, so the collection access rules in Leads/LeadNotes/LeadTasks/Users
 * are the actual security boundary — not just "the button is hidden in the
 * UI". An agent trying to move someone else's lead gets a Forbidden error
 * from Payload here, the same as it would from the REST API directly.
 */

export async function claimLead(leadId: number) {
  const user = await requireCrmUser();
  const payload = await getPayloadClient();
  await payload.update({
    collection: "leads",
    id: leadId,
    data: { assignedAgent: user.id },
    overrideAccess: false,
    user: user as User,
  });
  revalidatePath("/crm/leads");
  revalidatePath(`/crm/leads/${leadId}`);
  revalidatePath("/crm");
}

export async function reassignLead(leadId: number, agentId: number | null) {
  const user = await requireCrmUser();
  const payload = await getPayloadClient();
  await payload.update({
    collection: "leads",
    id: leadId,
    data: { assignedAgent: agentId },
    overrideAccess: false,
    user: user as User,
  });
  revalidatePath("/crm/leads");
  revalidatePath(`/crm/leads/${leadId}`);
  revalidatePath("/crm");
}

export async function updateLeadStage(leadId: number, stage: PipelineStage) {
  const user = await requireCrmUser();
  const payload = await getPayloadClient();
  await payload.update({
    collection: "leads",
    id: leadId,
    data: { pipelineStage: stage },
    overrideAccess: false,
    user: user as User,
  });
  revalidatePath("/crm/leads");
  revalidatePath(`/crm/leads/${leadId}`);
  revalidatePath("/crm");
}

export async function addNote(leadId: number, body: string) {
  const user = await requireCrmUser();
  const trimmed = body.trim();
  if (!trimmed) return;
  const payload = await getPayloadClient();
  await payload.create({
    collection: "lead-notes",
    data: { lead: leadId, body: trimmed.slice(0, 4000), author: user.id },
    overrideAccess: false,
    user: user as User,
  });
  revalidatePath(`/crm/leads/${leadId}`);
}

export async function addTask(
  leadId: number,
  input: { title: string; dueDate?: string; assignedTo: number },
) {
  const user = await requireCrmUser();
  const title = input.title.trim();
  if (!title) return;
  const payload = await getPayloadClient();
  await payload.create({
    collection: "lead-tasks",
    data: {
      lead: leadId,
      title: title.slice(0, 300),
      dueDate: input.dueDate || undefined,
      assignedTo: input.assignedTo,
      done: false,
    },
    overrideAccess: false,
    user: user as User,
  });
  revalidatePath(`/crm/leads/${leadId}`);
  revalidatePath("/crm/tasks");
  revalidatePath("/crm");
}

export async function toggleTask(taskId: number, done: boolean) {
  const user = await requireCrmUser();
  const payload = await getPayloadClient();
  const task = await payload.update({
    collection: "lead-tasks",
    id: taskId,
    data: { done },
    overrideAccess: false,
    user: user as User,
  });
  revalidatePath("/crm/tasks");
  revalidatePath("/crm");
  const leadId = task?.lead ? (typeof task.lead === "object" ? task.lead.id : task.lead) : null;
  if (leadId) revalidatePath(`/crm/leads/${leadId}`);
}

export async function updateUserRole(userId: number, role: "admin" | "agent") {
  const admin = await requireAdmin();
  const payload = await getPayloadClient();
  await payload.update({
    collection: "users",
    id: userId,
    data: { role },
    overrideAccess: false,
    user: admin as User,
  });
  revalidatePath("/crm/team");
}

export async function createTeamMember(input: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "agent";
}) {
  const admin = await requireAdmin();
  const payload = await getPayloadClient();
  await payload.create({
    collection: "users",
    data: input,
    overrideAccess: false,
    user: admin as User,
  });
  revalidatePath("/crm/team");
}
