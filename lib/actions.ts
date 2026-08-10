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
