/**
 * Pure rules for publishing regulatory credentials (§11.2, §11.3).
 *
 * Kept free of any database import so the rules are unit-testable on their
 * own: whether a number may be shown is a policy decision, not a data-access
 * concern.
 */

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
