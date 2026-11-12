import { describe, it, expect } from "vitest";
import { getSavedCalcPreset, CALCULATOR_PRESETS } from "./QuoteCalculator";

describe("instant quote only uses the pro's own prices", () => {
  it("returns nothing for an empty section or a built-in preset id", () => {
    expect(getSavedCalcPreset(undefined)).toBeNull();
    expect(getSavedCalcPreset({ calcPresetId: CALCULATOR_PRESETS[0].id })).toBeNull();
  });
  it("returns the pro's saved preset when it has a price", () => {
    const preset = { ...CALCULATOR_PRESETS[0], basePrice: 0, basePriceMax: 0,
      fields: [{ id: "a", label: "Job", type: "select", options: [{ label: "Panel", value: "p", priceMin: 900, priceMax: 1400 }] }] };
    expect(getSavedCalcPreset({ calcCustomPreset: preset })).toBe(preset);
  });
});
