import { describe, it, expect } from "vitest";
import { calculateEstimateTotalsFlat } from "@/hooks/useEstimates";
import { buildCustomerPayload } from "../../supabase/functions/estimate-share/logic";

const lines = [
  { title: "A", quantity: 1, unit_price: 1200, tax_percent: 13 },
  { title: "B", quantity: 1, unit_price: 800, tax_percent: 13 },
] as any[];

describe("discount comes off before tax", () => {
  it("10% discount on $2,000 at 13% tax", () => {
    const t = calculateEstimateTotalsFlat(lines, { discount_percent: 10 });
    expect([t.subtotal, t.discount_total, t.tax_total, t.grand_total]).toEqual([2000, 200, 234, 2034]);
  });
  it("$100 fixed discount on $2,000 at 13% tax", () => {
    const t = calculateEstimateTotalsFlat(lines, { discount_amount: 100 });
    expect([t.discount_total, t.tax_total, t.grand_total]).toEqual([100, 247, 2147]);
  });
  it("discount never exceeds the before-tax amount", () => {
    const t = calculateEstimateTotalsFlat(lines, { discount_amount: 5000 });
    expect([t.discount_total, t.tax_total, t.grand_total]).toEqual([2000, 0, 0]);
  });
  it("customer page shows the same discount from stored totals", () => {
    const p = buildCustomerPayload({ status: "sent", subtotal: 2000, tax_total: 234, grand_total: 2034 }, [], [], {}, null);
    expect(p.discount).toBe(200);
  });
});
