/**
 * Pure rules for publishing regulatory credentials (§11.2, §11.3).
 *
 * Kept free of any database import so the rules are unit-testable on their
 * own: whether a number may be shown is a policy decision, not a data-access
 * concern.
 */

/**
 * A wa.me link from any format the CMS might hold — "+971 58 582 7070",
 * "00971...", "971585827070" all reach the same place. Returns null when
 * there is no number, so callers render nothing rather than a dead button.
 *
 * Lives here rather than in the pages because three of them had their own
 * copy, and the first number entered with spaces would have broken all three.
 */
export function whatsappHref(
  number?: string | null,
  message = "Enquiry from rein-international.com",
): string | null {
  const digits = (number ?? "").replace(/\D/g, "").replace(/^00/, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function hasLapsed(expiry?: string | Date | null): boolean {
  if (!expiry) return false;
  return new Date(expiry).getTime() < Date.now();
}

/**
 * A lapsed broker card does not authorise anyone to act, so publishing its
 * number against a listing misrepresents the brokerage's standing. Returns
 * null when the card has expired — callers render nothing.
 */
export function brokerNumber(
  brn?: string | null,
  brnExpiry?: string | Date | null,
): string | null {
  if (!brn) return null;
  if (hasLapsed(brnExpiry)) return null;
  return `RERA BRN ${brn}`;
}
