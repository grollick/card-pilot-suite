import { describe, it, expect } from "vitest";
import { getSavedCalcPreset } from "./QuoteCalculator";

describe("instant quote only uses the pro's own prices", () => {
  it("returns nothing for an empty section or a preset id alone", () => {
    expect(getSavedCalcPreset(undefined)).toBeNull();
    expect(getSavedCalcPreset({ calcPresetId: "landscaper" })).toBeNull();
  });
  it("returns the pro's saved preset when it has a price", () => {
    const preset = { id: "custom", name: "x", professions: [], basePrice: 0, basePriceMax: 0,
      fields: [{ id: "a", label: "Job", type: "select", options: [{ label: "Panel", value: "p", priceMin: 900, priceMax: 1400 }] }] };
    expect(getSavedCalcPreset({ calcCustomPreset: preset })).toBe(preset);
  });
});
