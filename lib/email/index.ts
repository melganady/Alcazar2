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
  const from = process.env.EMAIL_FROM ?? "Alcázar <hello@alcazar.ae>";
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
  return `<!doctype html><html><body style="margin:0;background:#F0E5CF;font-family:Montserrat,Arial,sans-serif;color:#10182B">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F0E5CF;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #D8CDB6">
        <tr><td style="padding:32px 32px 24px">
          <p style="margin:0;font-size:20px;letter-spacing:0.2em;color:#1A41AD;font-weight:300">ALC&Aacute;ZAR</p>
        </td></tr>
        <tr><td style="padding:0 32px 8px">
          <p style="margin:0;font-size:14px;line-height:1.7">${leadName},</p>
          <p style="margin:12px 0 0;font-size:14px;line-height:1.7">Your enquiry is with me, not a queue. ${nextStep}</p>
        </td></tr>
        <tr><td style="padding:24px 32px 32px">
          <p style="margin:0;font-size:13px;line-height:1.6"><strong>${consultantName}</strong><br/>${consultantRole}, Alc&aacute;zar</p>
          <p style="margin:16px 0 0;font-size:10px;color:#6B7280;line-height:1.6">The address before it exists. &middot; Reply to this email to reach me directly.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
