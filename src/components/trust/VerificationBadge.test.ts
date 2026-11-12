import { describe, expect, it } from "vitest";
import { getVerificationLevel } from "./VerificationBadge";

describe("explicit verification", () => {
  it("does not upgrade a complete active profile automatically", () => {
    expect(getVerificationLevel({ name: "Plumber", profession_id: "trade", phone: "123", avatar_url: "photo", trust_score: 100 }, { leadCount: 50, bookingCount: 30, hasCard: true })).toBe("basic");
  });
  it("accepts only explicit verified levels", () => {
    expect(getVerificationLevel({ verification_level: "verified" })).toBe("verified");
    expect(getVerificationLevel({ verification_level: "pro_verified" })).toBe("pro_verified");
    expect(getVerificationLevel({ verification_level: "invalid" })).toBe("basic");
  });
});