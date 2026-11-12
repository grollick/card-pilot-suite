import { describe, it, expect } from "vitest";
import { buildEstimatePayload, calculateEstimateTotals } from "@/hooks/useEstimates";
import type { Database } from "@/integrations/supabase/types";

type Insert = Database["public"]["Tables"]["estimates"]["Insert"];
type Update = Database["public"]["Tables"]["estimates"]["Update"];
// Every column the table type allows (compile-time keyed so drift fails the type check).
const insertKeys: Record<keyof Insert, true> = {
  approved_at: true, booking_id: true, converted_booking_id: true, created_at: true, declined_at: true,
  deposit_amount: true, deposit_percent: true, discount_amount: true, discount_percent: true,
  estimate_number: true, expiry_date: true, grand_total: true, id: true, internal_notes: true,
  issue_date: true, job_address: true, job_type: true, labor_total: true, lead_id: true,
  markup_total: true, material_total: true, notes: true, org_id: true, scope_of_work: true,
  status: true, subtotal: true, tax_total: true, template_key: true, terms_conditions: true,
  updated_at: true, user_id: true,
};
const updateKeys: Record<keyof Update, true> = insertKeys;

const form = {
  estimate_number: "EST-1", status: "draft" as const, issue_date: "2026-11-12",
  deposit_percent: 25, sections: [{ name: "General", sort_order: 0, items: [] }],
};
const totals = calculateEstimateTotals(form.sections as any, { deposit_percent: 25 });

describe("estimate save payload", () => {
  it("create payload only has estimates columns", () => {
    const { sections, ...rest } = form;
    const keys = Object.keys({ ...buildEstimatePayload(rest, totals), user_id: "u" });
    expect(keys.filter((k) => !(k in insertKeys))).toEqual([]);
    expect(keys).not.toContain("balance_due");
    expect(keys).not.toContain("deposit_due");
  });
  it("update payload only has estimates columns", () => {
    const keys = Object.keys(buildEstimatePayload(form, totals));
    expect(keys.filter((k) => !(k in updateKeys))).toEqual([]);
    expect(keys).not.toContain("sections");
  });
});
