import { describe, it, expect } from "vitest";
import { buildPresetFromRows } from "@/modules/card/lib/priceList";
import { getSavedCalcPreset } from "@/modules/card/components/QuoteCalculator";
import { capServices, NEW_ACCOUNT_SERVICE_CAP } from "@/modules/onboarding/lib/serviceCap";
import { PLAN_CONFIGS } from "@/modules/billing/config/planLimits";

describe("instant quote price list", () => {
  it("builds one select field from priced rows, To defaults to From", () => {
    const p = buildPresetFromRows([
      { name: "Panel upgrade", from: "1500", to: "3000" },
      { name: "Outlet install", from: "120", to: "" },
    ], "Rough estimate.")!;
    expect(p.basePrice).toBe(0);
    expect(p.basePriceMax).toBe(0);
    expect(p.disclaimer).toBe("Rough estimate.");
    expect(p.fields).toHaveLength(1);
    expect(p.fields[0].id).toBe("job");
    expect(p.fields[0].label).toBe("What do you need?");
    expect(p.fields[0].options).toEqual([
      { label: "Panel upgrade", value: "job_0", priceMin: 1500, priceMax: 3000 },
      { label: "Outlet install", value: "job_1", priceMin: 120, priceMax: 120 },
    ]);
  });

  it("leaves out rows without a price", () => {
    const p = buildPresetFromRows([
      { name: "Rewire", from: "", to: "" },
      { name: "Light fixture", from: "90", to: "150" },
    ], "")!;
    expect(p.fields[0].options!.map((o) => o.label)).toEqual(["Light fixture"]);
    expect(buildPresetFromRows([{ name: "Rewire", from: "", to: "" }], "")).toBeNull();
  });

  it("getSavedCalcPreset returns a preset only when a price exists", () => {
    expect(getSavedCalcPreset({})).toBeNull();
    expect(getSavedCalcPreset({ calcCustomPreset: buildPresetFromRows([{ name: "A", from: "", to: "" }], "") })).toBeNull();
    const priced = buildPresetFromRows([{ name: "A", from: "50", to: "" }], "");
    expect(getSavedCalcPreset({ calcCustomPreset: priced })).toEqual(priced);
  });
});

describe("new account service cap", () => {
  it("keeps only as many services as the Free plan allows", () => {
    expect(NEW_ACCOUNT_SERVICE_CAP).toBe(PLAN_CONFIGS.free.limits.services);
    expect(capServices(["a", "b", "c", "d", "e"])).toHaveLength(PLAN_CONFIGS.free.limits.services);
    expect(capServices(["a", "b", "c", "d", "e"], 3)).toEqual(["a", "b", "c"]);
  });
});
