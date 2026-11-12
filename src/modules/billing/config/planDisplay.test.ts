import { describe, expect, it } from "vitest";
import { PLAN_DISPLAY, PLAN_COMPARISON } from "./planDisplay";

describe("public beta plans", () => {
  it("offers only the free plan today", () => {
    expect(PLAN_DISPLAY.filter(plan => plan.status === "available").map(plan => plan.key)).toEqual(["free"]);
    expect(PLAN_DISPLAY.filter(plan => plan.status === "coming_soon").map(plan => plan.key)).toEqual(["growth", "pro", "agency"]);
  });
  it("keeps the four advertised prices", () => {
    expect(PLAN_DISPLAY.map(plan => plan.price)).toEqual([0, 39, 79, 279]);
  });
  it("displays the enforced three-service free limit", () => {
    expect(PLAN_COMPARISON.find(row => row.key === "services")?.values).toEqual(["3", "Unlimited", "Unlimited", "Unlimited"]);
  });
  it("displays the enforced 20-contact free limit", () => {
    expect(PLAN_COMPARISON.find(row => row.key === "contacts")?.values).toEqual(["20", "Unlimited", "Unlimited", "Unlimited"]);
  });
  it("displays the enforced 10-bookings-a-month free limit", () => {
    expect(PLAN_COMPARISON.find(row => row.key === "booking")?.values).toEqual(["10", "Unlimited", "Unlimited", "Unlimited"]);
  });
});