/**
 * §13 — autoresponder: named consultant, real reply-to, specific next step.
 * Resend when RESEND_API_KEY exists; console adapter otherwise so dev stays
 * observable. Never "a member of our team will be in touch."
 */
export type OutboundEmail = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export interface EmailAdapter {
  name: string;
  send(email: OutboundEmail): Promise<{ ok: boolean; error?: string }>;
}

const consoleAdapter: EmailAdapter = {
  name: "console",
  async send(email) {
    console.log(`[email:console] to=${email.to} subject="${email.subject}" replyTo=${email.replyTo ?? "-"}`);
    return { ok: true };
  },
};

const resendAdapter = (apiKey: string, from: string): EmailAdapter => ({
  name: "resend",
  async send(email) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        reply_to: email.replyTo,
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `resend ${res.status}: ${(await res.text()).slice(0, 300)}` };
    }
    return { ok: true };
  },
});

export function getEmailAdapter(): EmailAdapter {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "REIN Investment <hello@rein.investments>";
  return key ? resendAdapter(key, from) : consoleAdapter;
}

/** Brand-voiced autoresponder. Numbers first, no exclamation marks. */
export function autoresponderHtml({
  leadName,
  consultantName,
  consultantRole,
  nextStep,
}: {
  leadName: string;
  consultantName: string;
  consultantRole: string;
  nextStep: string;
}): string {
  return `<!doctype html><html><body style="margin:0;background:#F2F2F3;font-family:Barlow,Arial,sans-serif;color:#2B2B2D">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F3;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #C7C8D0">
        <tr><td style="padding:0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050A30">
            <tr><td style="padding:26px 32px">
              <p style="margin:0;font-size:22px;line-height:1.1;color:#FFFFFF;font-weight:700;font-family:'Barlow Condensed',Barlow,Arial,sans-serif">REIN Investment</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:28px 32px 8px">
          <p style="margin:0;font-size:15px;line-height:1.65">${leadName},</p>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.65">Your enquiry is with me, not a queue. ${nextStep}</p>
        </td></tr>
        <tr><td style="padding:24px 32px 32px">
          <p style="margin:0;font-size:13px;line-height:1.6"><strong>${consultantName}</strong><br/>${consultantRole}, REIN Investment</p>
          <p style="margin:16px 0 0;font-size:11px;color:#5D5D60;line-height:1.6">Fresh thinking, real income. &middot; Reply to this email to reach me directly.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
