import type { Lead } from "@/payload-types";

/**
 * §13 — CRM adapter interface. HubSpot first; Bitrix24/Zoho stay pluggable
 * by implementing CrmAdapter. Without credentials the console adapter keeps
 * the pipeline observable in dev.
 */
export type CrmResult = { ok: boolean; externalId?: string; error?: string };

export interface CrmAdapter {
  name: string;
  pushLead(lead: Lead): Promise<CrmResult>;
}

const consoleAdapter: CrmAdapter = {
  name: "console",
  async pushLead(lead) {
    console.log(`[crm:console] lead ${lead.id} · ${lead.name} · ${lead.email ?? "no email"} · ${lead.sourcePage ?? ""}`);
    return { ok: true };
  },
};

/**
 * HubSpot contacts API v3. Standard properties only until the portal's
 * custom properties are agreed — residency/budget/source travel in a
 * follow-up note once credentials exist and the mapping is confirmed.
 */
const hubspotAdapter = (token: string): CrmAdapter => ({
  name: "hubspot",
  async pushLead(lead) {
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          email: lead.email ?? undefined,
          firstname: lead.name,
          phone: lead.phone ?? undefined,
        },
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `hubspot ${res.status}: ${(await res.text()).slice(0, 300)}` };
    }
    const json = (await res.json()) as { id?: string };
    return { ok: true, externalId: json.id };
  },
});

export function getCrmAdapter(): CrmAdapter {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  return token ? hubspotAdapter(token) : consoleAdapter;
}
