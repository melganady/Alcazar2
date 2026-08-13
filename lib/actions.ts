"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getPayloadClient } from "./payload";
import { rateLimit } from "./rateLimit";

async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

/** Cloudflare Turnstile — active only when the secret is configured (§13). */
async function turnstileOk(formData: FormData): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  const token = String(formData.get("cf-turnstile-response") || "");
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  const json = (await res.json()) as { success?: boolean };
  return Boolean(json.success);
}

/**
 * §13 lead capture — minimal Phase 3 version. Phase 5 adds the CRM webhook,
 * autoresponder, rate limiting and Turnstile. Honeypot: the "company" field
 * is invisible to humans; bots that fill it get a silent success.
 */
export async function createLead(formData: FormData) {
  const returnTo = String(formData.get("returnTo") || "/");
  const honeypot = String(formData.get("company") || "");
  const allowed =
    !honeypot && rateLimit(await clientKey()) && (await turnstileOk(formData));

  if (allowed) {
    const payload = await getPayloadClient();
    const residency = String(formData.get("residencyStatus") || "");
    const purpose = String(formData.get("purpose") || "");
    const videoUrl = String(formData.get("videoUrl") || "").slice(0, 300);
    const kind = String(formData.get("leadKind") || "");
    let message = String(formData.get("message") || "").slice(0, 2000);
    // Secondary desk: which markets they want, so demand is measurable per market.
    const markets = formData.getAll("markets").map(String).filter(Boolean);
    if (markets.length > 0) {
      message = `Secondary interest — ${markets.join(", ")}${message ? `\n${message}` : ""}`;
    }
    if (kind === "career") {
      message = `Career application — video: ${videoUrl || "not provided"}${message ? `\n${message}` : ""}`;
    }
    await payload.create({
      collection: "leads",
      data: {
        name: String(formData.get("name") || "").slice(0, 200),
        email: String(formData.get("email") || "").slice(0, 200) || undefined,
        phone: String(formData.get("phone") || "").slice(0, 50) || undefined,
        whatsappConsent: formData.get("whatsappConsent") === "on",
        marketingConsent: formData.get("marketingConsent") === "on",
        residencyStatus: ["uae-resident", "non-resident", "uae-national"].includes(residency)
          ? (residency as "uae-resident" | "non-resident" | "uae-national")
          : undefined,
        budgetBandAED: String(formData.get("budgetBandAED") || "").slice(0, 100) || undefined,
        purpose: ["investment", "end-use", "both"].includes(purpose)
          ? (purpose as "investment" | "end-use" | "both")
          : undefined,
        financeNeeded: formData.get("financeNeeded") === "on",
        sourceProject: Number(formData.get("sourceProject")) || undefined,
        sourcePage: String(formData.get("sourcePage") || "").slice(0, 300),
        locale: String(formData.get("locale") || "en"),
        message: message || undefined,
        // Alcázar CRM — every lead starts unclaimed in the New queue.
        pipelineStage: "new",
      },
    });
  }

  // Bots and rate-limited callers get the same redirect — nothing to probe.
  redirect(`${returnTo}?sent=1#enquire`);
}

/**
 * §8 soft gate — results stay visible; emailing the PDF costs name + email +
 * residency. That is the lead. PDF generation + Resend dispatch land in
 * Phase 5; the request is captured with the full scenario now.
 */
export async function requestCalculatorPdf(
  _prev: { ok: boolean } | null,
  formData: FormData,
): Promise<{ ok: boolean }> {
  const honeypot = String(formData.get("company") || "");
  if (honeypot || !rateLimit(await clientKey()) || !(await turnstileOk(formData))) {
    return { ok: true }; // indistinguishable from success — nothing to probe
  }

  const residency = String(formData.get("residencyStatus") || "");
  const payload = await getPayloadClient();
  await payload.create({
    collection: "leads",
    data: {
      name: String(formData.get("name") || "").slice(0, 200),
      email: String(formData.get("email") || "").slice(0, 200) || undefined,
      residencyStatus: ["uae-resident", "non-resident", "uae-national"].includes(residency)
        ? (residency as "uae-resident" | "non-resident" | "uae-national")
        : undefined,
      financeNeeded: true,
      sourcePage: "/mortgages/calculator",
      locale: String(formData.get("locale") || "en"),
      message: `Calculator PDF request. Scenario: ${String(formData.get("scenario") || "").slice(0, 1500)}`,
      pipelineStage: "new",
    },
  });
  return { ok: true };
}
