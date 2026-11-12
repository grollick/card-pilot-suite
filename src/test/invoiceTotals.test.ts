import { describe, it, expect } from "vitest";
import { calculateInvoiceTotals, buildInvoiceFromEstimate, totalsFromInvoiceRow } from "@/lib/invoiceTotals";

const line = (o: any) => ({ title: "x", quantity: 1, unit_price: 0, tax_percent: 0, ...o });

// Simulate save then reopen in the editor
const reopen = (inv: ReturnType<typeof buildInvoiceFromEstimate>) =>
  calculateInvoiceTotals({ lineTotals: inv.lines.map((l) => l.line_total), taxPercent: inv.tax_percent, discountAmount: inv.discount_amount });

describe("invoice totals", () => {
  it("1: estimate 2x450 + 1x1100, 13%, 10% off", () => {
    const inv = buildInvoiceFromEstimate({ discount_percent: 10 }, [
      line({ quantity: 2, unit_price: 450, tax_percent: 13 }), line({ quantity: 1, unit_price: 1100, tax_percent: 13 }),
    ]);
    expect(inv.lines.map((l) => l.line_total)).toEqual([900, 1100]);
    expect(inv).toMatchObject({ subtotal: 2000, discount_amount: 200, tax_total: 234, grand_total: 2034 });
    expect(Math.round(inv.tax_percent * 100) / 100).toBe(13);
    expect(reopen(inv)).toEqual({ subtotal: 2000, discount: 200, tax: 234, total: 2034 });
  });
  it("2: 1x2000, 13%, $100 off", () => {
    const inv = buildInvoiceFromEstimate({ discount_amount: 100 }, [line({ unit_price: 2000, tax_percent: 13 })]);
    expect(inv).toMatchObject({ subtotal: 2000, discount_amount: 100, tax_total: 247, grand_total: 2147 });
    expect(reopen(inv).total).toBe(2147);
  });
  it("3: hand typed 1000 at 13% saves and reloads the same", () => {
    const t = calculateInvoiceTotals({ lineTotals: [1000], taxPercent: 13, discountAmount: 0 });
    expect(t).toEqual({ subtotal: 1000, discount: 0, tax: 130, total: 1130 });
    expect(totalsFromInvoiceRow({ subtotal: 1000, discount_amount: 0, tax_total: 130, tax_percent: 13 }).total).toBe(1130);
  });
  it("4: 1000 at 13% with $100 off", () => {
    expect(calculateInvoiceTotals({ lineTotals: [1000], taxPercent: 13, discountAmount: 100 })).toEqual({ subtotal: 1000, discount: 100, tax: 117, total: 1017 });
  });
  it("5: no tax, no discount", () => {
    expect(calculateInvoiceTotals({ lineTotals: [780], taxPercent: 0, discountAmount: 0 }).total).toBe(780);
  });
  it("6: mixed rates stay $2,130 after reopening", () => {
    const inv = buildInvoiceFromEstimate({}, [line({ unit_price: 1000, tax_percent: 13 }), line({ unit_price: 1000, tax_percent: 0 })]);
    expect(inv).toMatchObject({ tax_total: 130, grand_total: 2130 });
    expect(reopen(inv)).toMatchObject({ tax: 130, total: 2130 });
  });
  it("discount never more than subtotal", () => {
    expect(calculateInvoiceTotals({ lineTotals: [50], taxPercent: 13, discountAmount: 80 }).total).toBe(0);
  });
  it("optional lines are skipped and labour/materials/markup carried", () => {
    const inv = buildInvoiceFromEstimate({}, [
      line({ unit_price: 100, labor_hours: 2, labor_rate: 50, material_cost: 100, markup_percent: 10, quantity: 2 }),
      line({ unit_price: 999, is_optional: true }),
    ]);
    expect(inv.lines).toHaveLength(1);
    expect(inv.lines[0]).toMatchObject({ line_total: 440, unit_price: 220 });
  });
});
