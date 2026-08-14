/**
 * §12 analytics events. Pushed to dataLayer; server-side mirroring is added
 * with the Plausible/GA4 credentials. Nothing here fires before consent —
 * hasAnalyticsConsent() gates every push (§11.8).
 */
export type AnalyticsEvent =
  | { name: "project_view"; slug: string; community?: string; status?: string }
  | { name: "filter_applied"; facets: Record<string, string> }
  | { name: "compare_added"; slug: string; count: number }
  | { name: "payment_plan_interacted"; slug: string; unitPriceAED: number }
  | {
      name: "calculator_used";
      residencyStatus: string;
      bindingConstraint: string;
      propertyStatus: string;
    }
  | { name: "pdf_gated_submit"; residencyStatus: string }
  | { name: "whatsapp_click"; source: string; slug?: string }
  | { name: "call_click"; source: string; slug?: string }
  | { name: "lead_submit"; sourcePage: string; residencyStatus?: string }
  | { name: "career_apply" };

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export const CONSENT_COOKIE = "rein-consent";

export function hasAnalyticsConsent(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((c) => c === `${CONSENT_COOKIE}=accepted`);
}

export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;
  const { name, ...params } = event;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: name, ...params });
}
