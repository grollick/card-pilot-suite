import { describe, expect, it } from "vitest";
import { formatServicePrice, formatServiceDuration } from "./serviceDisplay";

describe("public service display", () => {
  it("shows no price when none is set", () => {
    expect(formatServicePrice(null)).toBe("");
    expect(formatServicePrice(undefined)).toBe("");
    expect(formatServicePrice("")).toBe("");
  });
  it("shows Free only for an explicit zero, preserving descriptive prices", () => {
    expect(formatServicePrice(0)).toBe("Free");
    expect(formatServicePrice("0")).toBe("Free");
    expect(formatServicePrice(25)).toBe("$25");
    expect(formatServicePrice("From $25")).toBe("From $25");
  });
  it("uses hours from 60 minutes", () => {
    expect(formatServiceDuration(45)).toBe("45 min");
    expect(formatServiceDuration(60)).toBe("1 hr");
    expect(formatServiceDuration(90)).toBe("1.5 hrs");
  });
  it("uses days from 1440 minutes", () => {
    expect(formatServiceDuration(1440)).toBe("1 day");
    expect(formatServiceDuration(2160)).toBe("1.5 days");
    expect(formatServiceDuration(2880)).toBe("2 days");
  });
});