"use server";

import { redirect } from "next/navigation";
import { getPayloadClient } from "./payload";

/**
 * §13 lead capture — minimal Phase 3 version. Phase 5 adds the CRM webhook,
 * autoresponder, rate limiting and Turnstile. Honeypot: the "company" field
 * is invisible to humans; bots that fill it get a silent success.
 */
export async function createLead(formData: FormData) {
  const returnTo = String(formData.get("returnTo") || "/");
  const honeypot = String(formData.get("company") || "");

  if (!honeypot) {
    const payload = await getPayloadClient();
    const residency = String(formData.get("residencyStatus") || "");
    const purpose = String(formData.get("purpose") || "");
    await payload.create({
      collection: "leads",
      data: {
        name: String(formData.get("name") || "").slice(0, 200),
        email: String(formData.get("email") || "").slice(0, 200) || undefined,
        phone: String(formData.get("phone") || "").slice(0, 50) || undefined,
        whatsappConsent: formData.get("whatsappConsent") === "on",
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
        message: String(formData.get("message") || "").slice(0, 2000) || undefined,
      },
    });
  }

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
  if (honeypot) return { ok: true };

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
    },
  });
  return { ok: true };
}
