import type { CollectionConfig } from "payload";
import { getCrmAdapter } from "@/lib/crm";
import { autoresponderHtml, getEmailAdapter } from "@/lib/email";
import { newLeadAlertHtml, getInternalAlertAdapter } from "@/lib/notifications";
import { PIPELINE_STAGES, STAGE_LABEL, adminOnly, leadVisibilityWhere } from "./crmShared";

export const Leads: CollectionConfig = {
  slug: "leads",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "pipelineStage", "assignedAgent", "sourceProject", "createdAt"],
    description: "PDPL: lawful basis is captured per submission; deletion requests are honoured here.",
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== "create") return;

        // §13 — CRM push. Failure never blocks the lead; it stays visible
        // in the admin with crmSyncedAt empty for manual retry.
        try {
          const crm = getCrmAdapter();
          const result = await crm.pushLead(doc);
          if (result.ok) {
            await req.payload.update({
              collection: "leads",
              id: doc.id,
              data: { crmSyncedAt: new Date().toISOString() },
            });
          } else {
            req.payload.logger.error(`CRM push failed (${crm.name}): ${result.error}`);
          }
        } catch (err) {
          req.payload.logger.error(`CRM push threw: ${String(err)}`);
        }

        // §13 — autoresponder from a named consultant with a real reply-to.
        try {
          if (doc.email) {
            const agents = await req.payload.find({
              collection: "agents",
              limit: 1,
              sort: "slug",
            });
            const agent = agents.docs[0];
            if (agent) {
              const isCareer = doc.message?.startsWith("Career application");
              const email = getEmailAdapter();
              const result = await email.send({
                to: doc.email,
                subject: isCareer
                  ? "Your application — Alcázar"
                  : "Your enquiry — Alcázar",
                replyTo: agent.email ?? undefined,
                html: autoresponderHtml({
                  leadName: doc.name,
                  consultantName: agent.name,
                  consultantRole: agent.role,
                  nextStep: isCareer
                    ? "I review every application myself. If the video lands, we talk this week."
                    : "I will come back within one working day with availability, the payment plan against your budget, and the financing route that fits your residency status.",
                }),
              });
              if (!result.ok) {
                req.payload.logger.error(`Autoresponder failed: ${result.error}`);
              }
            }
          }
        } catch (err) {
          req.payload.logger.error(`Autoresponder threw: ${String(err)}`);
        }

        // Alcázar CRM — alert the team the moment a lead lands, so no one
        // finds out from the client first. Failure never blocks the lead.
        try {
          let sourceLabel = doc.sourcePage || "General enquiry";
          if (doc.sourceProject) {
            try {
              const project = await req.payload.findByID({
                collection: "projects",
                id: typeof doc.sourceProject === "object" ? doc.sourceProject.id : doc.sourceProject,
                depth: 0,
              });
              if (project?.name) sourceLabel = project.name;
            } catch {
              // Relationship may have been deleted; fall back to sourcePage.
            }
          }
          const alert = getInternalAlertAdapter();
          const result = await alert.send({
            leadName: doc.name,
            leadEmail: doc.email ?? undefined,
            leadPhone: doc.phone ?? undefined,
            sourceLabel,
            crmUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/crm/leads/${doc.id}`,
            html: newLeadAlertHtml({
              leadName: doc.name,
              leadEmail: doc.email,
              leadPhone: doc.phone,
              sourceLabel,
              message: doc.message,
              crmUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/crm/leads/${doc.id}`,
            }),
          });
          await req.payload.create({
            collection: "lead-activity",
            data: {
              lead: doc.id,
              kind: "notification",
              message: result.ok
                ? `Team alerted via ${alert.name} — ${sourceLabel}`
                : `Team alert via ${alert.name} failed: ${result.error ?? "unknown error"}`,
            },
          });
        } catch (err) {
          req.payload.logger.error(`New-lead alert threw: ${String(err)}`);
        }
      },
      // Alcázar CRM — activity feed. Runs after the notification hook above
      // so "Lead created" always appears before "Team alerted".
      async ({ doc, previousDoc, operation, req }) => {
        try {
          if (operation === "create") {
            await req.payload.create({
              collection: "lead-activity",
              data: {
                lead: doc.id,
                kind: "stage-change",
                message: `Lead created — stage: ${STAGE_LABEL[doc.pipelineStage] ?? doc.pipelineStage}`,
                actor: req.user?.id,
              },
            });
            return;
          }
          if (previousDoc && previousDoc.pipelineStage !== doc.pipelineStage) {
            await req.payload.create({
              collection: "lead-activity",
              data: {
                lead: doc.id,
                kind: "stage-change",
                message: `Stage changed: ${STAGE_LABEL[previousDoc.pipelineStage] ?? previousDoc.pipelineStage ?? "—"} → ${STAGE_LABEL[doc.pipelineStage] ?? doc.pipelineStage}`,
                actor: req.user?.id,
              },
            });
          }
          const prevAgent = previousDoc?.assignedAgent
            ? typeof previousDoc.assignedAgent === "object"
              ? previousDoc.assignedAgent.id
              : previousDoc.assignedAgent
            : null;
          const nextAgent = doc.assignedAgent
            ? typeof doc.assignedAgent === "object"
              ? doc.assignedAgent.id
              : doc.assignedAgent
            : null;
          if (previousDoc && prevAgent !== nextAgent) {
            let message = "Unassigned";
            if (nextAgent) {
              try {
                const agentUser = await req.payload.findByID({ collection: "users", id: nextAgent, depth: 0 });
                message = `Assigned to ${agentUser?.name || agentUser?.email || "team member"}`;
              } catch {
                message = "Assigned";
              }
            }
            await req.payload.create({
              collection: "lead-activity",
              data: { lead: doc.id, kind: "assignment", message, actor: req.user?.id },
            });
          }
        } catch (err) {
          req.payload.logger.error(`lead-activity write failed (lead): ${String(err)}`);
        }
      },
    ],
  },
  access: {
    // Created via server actions only. Reads/edits: admins see every lead;
    // agents see leads assigned to them plus unassigned ones (so there is
    // something to claim). Deletes are admin-only — an agent losing a lead
    // by mistake should never be one click away.
    read: ({ req }) => {
      if (!req.user) return false;
      if (req.user.role === "admin") return true;
      return leadVisibilityWhere(req.user.id);
    },
    create: () => true,
    update: ({ req }) => {
      if (!req.user) return false;
      if (req.user.role === "admin") return true;
      return leadVisibilityWhere(req.user.id);
    },
    delete: adminOnly,
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email" },
    { name: "phone", type: "text" },
    { name: "whatsappConsent", type: "checkbox", defaultValue: false },
    { name: "marketingConsent", type: "checkbox", defaultValue: false },
    {
      name: "residencyStatus",
      type: "select",
      options: ["uae-resident", "non-resident", "uae-national"],
    },
    { name: "budgetBandAED", type: "text" },
    { name: "purpose", type: "select", options: ["investment", "end-use", "both"] },
    { name: "financeNeeded", type: "checkbox" },
    { name: "sourceProject", type: "relationship", relationTo: "projects" },
    { name: "sourcePage", type: "text" },
    { name: "utm", type: "json" },
    { name: "locale", type: "text" },
    { name: "currency", type: "text" },
    { name: "message", type: "textarea" },
    { name: "crmSyncedAt", type: "date" },
    // ---- Alcázar CRM (Phase 4) ----
    {
      name: "pipelineStage",
      type: "select",
      required: true,
      defaultValue: "new",
      index: true,
      options: PIPELINE_STAGES as unknown as { label: string; value: string }[],
      admin: { position: "sidebar" },
    },
    {
      name: "assignedAgent",
      type: "relationship",
      relationTo: "users",
      index: true,
      admin: { position: "sidebar", description: "Empty = unclaimed, visible to every agent in the New queue." },
    },
  ],
};
