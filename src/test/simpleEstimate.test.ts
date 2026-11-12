import { describe, it, expect } from "vitest";
import { calculateLineTotals, calculateEstimateTotals } from "@/hooks/useEstimates";
import { EMPTY_LINE_ITEM, simpleLineItem, needsFullEditor } from "@/modules/estimates/lib/simpleEstimate";

const sec = (items: any[]) => [{ name: "General", sort_order: 0, items }];

describe("simple estimate lines", () => {
  it("map to the same line the full editor would save", () => {
    const simple = simpleLineItem("Paint living room", 2, 450, 13, 0);
    const full = calculateLineTotals({ ...EMPTY_LINE_ITEM, title: "Paint living room", quantity: 2, unit: "each", unit_price: 450, tax_percent: 13, sort_order: 0 });
    expect(simple).toEqual(full);
    expect(simple.unit).toBe("each");
    expect(simple.line_total).toBe(1017);
  });
  it("totals come from the shared calculation", () => {
    const items = [simpleLineItem("A", 1, 1000, 13, 0), simpleLineItem("B", 2, 50, 13, 1)];
    const t = calculateEstimateTotals(sec(items), { discount_percent: 10 });
    expect(t.subtotal).toBe(1100);
    expect(t.tax_total).toBe(143);
    expect(t.grand_total).toBe(1118.7);
  });
});

describe("opens in full editor", () => {
  const plain = simpleLineItem("A", 1, 100, 5, 0);
  it("a simple estimate stays simple", () => expect(needsFullEditor(sec([plain, simpleLineItem("B", 3, 10, 5, 1)]))).toBe(false));
  it("labor, material or markup", () => {
    expect(needsFullEditor(sec([{ ...plain, labor_hours: 2 }]))).toBe(true);
    expect(needsFullEditor(sec([{ ...plain, material_cost: 20 }]))).toBe(true);
    expect(needsFullEditor(sec([{ ...plain, markup_percent: 10 }]))).toBe(true);
  });
  it("more than one section", () => expect(needsFullEditor([...sec([plain]), { name: "B", sort_order: 1, items: [plain] }] as any)).toBe(true));
  it("optional items", () => expect(needsFullEditor(sec([{ ...plain, is_optional: true }]))).toBe(true));
  it("different tax rates per line", () => expect(needsFullEditor(sec([plain, { ...plain, tax_percent: 13 }]))).toBe(true));
});
