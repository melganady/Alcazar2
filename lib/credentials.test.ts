import { describe, expect, it } from "vitest";
import { brokerNumber } from "./credentials";

/*
 * A lapsed broker card does not authorise anyone to act, so publishing its
 * number against a listing misrepresents the brokerage's standing (§11.2).
 * The same reasoning drives licence suppression in getComplianceIdentity.
 */
describe("brokerNumber", () => {
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const past = new Date(Date.now() - 86_400_000).toISOString();

  it("renders a current broker number", () => {
    expect(brokerNumber("44854", future)).toBe("RERA BRN 44854");
  });
  it("renders a number with no recorded expiry", () => {
    expect(brokerNumber("44854", null)).toBe("RERA BRN 44854");
  });
  it("suppresses an expired card rather than publishing a lapsed number", () => {
    expect(brokerNumber("44854", past)).toBeNull();
  });
  it("renders nothing without a number", () => {
    expect(brokerNumber(null, future)).toBeNull();
    expect(brokerNumber("", future)).toBeNull();
  });
});
