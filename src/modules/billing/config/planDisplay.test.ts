import { describe, expect, it } from "vitest";
import { PLAN_DISPLAY, PLAN_COMPARISON } from "./planDisplay";

describe("public beta plans", () => {
  it("offers only the free plan today", () => {
    expect(PLAN_DISPLAY.filter(plan => plan.status === "available").map(plan => plan.key)).toEqual(["free"]);
    expect(PLAN_DISPLAY.filter(plan => plan.status === "coming_soon").map(plan => plan.key)).toEqual(["pro", "pro_plus"]);
  });
  it("keeps the three advertised prices", () => {
    expect(PLAN_DISPLAY.map(plan => plan.price)).toEqual([0, 29, 79]);
  });
  it("displays the enforced three-service free limit", () => {
    expect(PLAN_COMPARISON.find(row => row.key === "services")?.values).toEqual(["3", "Unlimited", "Unlimited"]);
  });
  it("displays the enforced 100-contact free limit", () => {
    expect(PLAN_COMPARISON.find(row => row.key === "contacts")?.values).toEqual(["100", "Unlimited", "Unlimited"]);
  });
});