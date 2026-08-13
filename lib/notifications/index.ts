import { getEmailAdapter } from "@/lib/email";

/**
 * Alcázar CRM — internal "new lead" alert to the team. Distinct from
 * lib/email's autoresponder (which writes to the *lead*): this notifies
 * *staff* the moment a lead lands, with a link straight to its CRM page.
 *
 * Email via Resend today (the channel confirmed for v1); the adapter shape
 * leaves room for Slack/WhatsApp to be added the same way lib/crm and
 * lib/email already do it — implement the interface, swap it in behind an
 * env var, nothing else in the codebase changes.
 */
export type InternalAlertResult = { ok: boolean; error?: string };

export interface InternalAlertAdapter {
  name: string;
  send(input: {
    leadName: string;
    leadEmail?: string;
    leadPhone?: string;
    sourceLabel: string;
    crmUrl: string;
    html: string;
  }): Promise<InternalAlertResult>;
}

const consoleAdapter: InternalAlertAdapter = {
  name: "console",
  async send(input) {
    console.log(
      `[notify:console] new lead — ${input.leadName} · ${input.sourceLabel} · ${input.leadEmail ?? "no email"} · ${input.crmUrl}`,
    );
    return { ok: true };
  },
};

/** One send per configured recipient, via the existing Resend adapter. */
const emailAdapter = (recipients: string[]): InternalAlertAdapter => ({
  name: "email",
  async send(input) {
    const email = getEmailAdapter();
    const results = await Promise.all(
      recipients.map((to) =>
        email.send({
          to,
          subject: `New lead — ${input.leadName} · ${input.sourceLabel}`,
          html: input.html,
        }),
      ),
    );
    const failed = results.filter((r) => !r.ok);
    return failed.length > 0
      ? { ok: false, error: failed.map((f) => f.error).join("; ") }
      : { ok: true };
  },
});

/**
 * CRM_ALERT_EMAILS — comma-separated internal recipients (e.g. the sales
 * desk distribution address, or every agent's email while the team is
 * small). Falls back to console logging so dev/build never breaks and a
 * missing env var fails loud in the logs rather than silently dropping
 * leads.
 */
export function getInternalAlertAdapter(): InternalAlertAdapter {
  const recipients = (process.env.CRM_ALERT_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return recipients.length > 0 ? emailAdapter(recipients) : consoleAdapter;
}

/** Brand-voiced internal alert. Numbers first, one clear action. */
export function newLeadAlertHtml({
  leadName,
  leadEmail,
  leadPhone,
  sourceLabel,
  message,
  crmUrl,
}: {
  leadName: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
  sourceLabel: string;
  message?: string | null;
  crmUrl: string;
}): string {
  const rows = [
    leadEmail ? `<tr><td style="padding:4px 0;font-size:13px;color:#3F4244;opacity:0.8">Email</td><td style="padding:4px 0;font-size:13px">${leadEmail}</td></tr>` : "",
    leadPhone ? `<tr><td style="padding:4px 0;font-size:13px;color:#3F4244;opacity:0.8">Phone</td><td style="padding:4px 0;font-size:13px">${leadPhone}</td></tr>` : "",
    `<tr><td style="padding:4px 0;font-size:13px;color:#3F4244;opacity:0.8">Source</td><td style="padding:4px 0;font-size:13px">${sourceLabel}</td></tr>`,
  ].join("");
  return `<!doctype html><html><body style="margin:0;background:#F7F7F5;font-family:Montserrat,Arial,sans-serif;color:#3F4244">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F5;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#EDEAE3;border:1px solid #D7D1C6">
        <tr><td style="padding:32px 32px 8px">
          <p style="margin:0;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#8A937F">Alcázar CRM · New lead</p>
        </td></tr>
        <tr><td style="padding:8px 32px 0">
          <p style="margin:0;font-size:20px;font-weight:500">${leadName}</p>
        </td></tr>
        <tr><td style="padding:16px 32px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td></tr>
        ${message ? `<tr><td style="padding:16px 32px 0"><p style="margin:0;font-size:13px;line-height:1.6;color:#3F4244;opacity:0.9">"${message.slice(0, 400)}"</p></td></tr>` : ""}
        <tr><td style="padding:24px 32px 32px">
          <a href="${crmUrl}" style="display:inline-block;background:#3F4244;color:#D7D1C6;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:12px 24px">Open in CRM</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
