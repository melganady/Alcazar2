import type { Access, Where } from "payload";

/**
 * Alcázar CRM — shared constants and access helpers for the Leads/Notes/
 * Tasks/ActivityLog collections. Pipeline stages are hardcoded for v1 per
 * the brief (§Phase 4); making them admin-editable is a fast-follow, not a
 * schema change — swap this array for a `pipeline-stages` collection and the
 * `select` fields below for `relationship` fields when that lands.
 */
export const PIPELINE_STAGES = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Viewing scheduled", value: "viewing-scheduled" },
  { label: "Offer made", value: "offer-made" },
  { label: "Closed won", value: "closed-won" },
  { label: "Closed lost", value: "closed-lost" },
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number]["value"];

export const STAGE_LABEL: Record<string, string> = Object.fromEntries(
  PIPELINE_STAGES.map((s) => [s.value, s.label]),
);

/**
 * A lead is visible/editable by an admin (always) or by the agent it is
 * assigned to. Unassigned leads stay visible so an agent can claim one out
 * of the New queue — without this an agent could never find a lead to
 * claim in the first place.
 */
export const leadVisibilityWhere = (userId: number | string): Where => ({
  or: [{ assignedAgent: { equals: userId } }, { assignedAgent: { exists: false } }],
});

/** Read/update access shared by Leads and by anything that hangs off a lead. */
export const staffOnly: Access = ({ req }) => Boolean(req.user);

export const adminOnly: Access = ({ req }) => req.user?.role === "admin";
