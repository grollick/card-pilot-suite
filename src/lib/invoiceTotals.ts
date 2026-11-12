// One rule for invoice totals (matches estimates: discount before tax).
// subtotal = sum of line totals (qty x unit price, before tax)
// discount = Discount $ amount, never more than subtotal
// tax = (subtotal - discount) x tax percent / 100
// total = subtotal - discount + tax
import { applyDiscountBeforeTax } from "@/lib/estimateDiscount";

const round = (n: number) => Math.round(n * 100) / 100;

export interface InvoiceTotals { subtotal: number; discount: number; tax: number; total: number }

export function calculateInvoiceTotals(input: {
  lineTotals: number[];
  taxPercent: number;
  discountAmount: number;
}): InvoiceTotals {
  const subtotal = round(input.lineTotals.reduce((s, n) => s + (Number(n) || 0), 0));
  const discount = round(Math.min(Math.max(0, Number(input.discountAmount) || 0), Math.max(0, subtotal)));
  const tax = round((subtotal - discount) * (Number(input.taxPercent) || 0) / 100);
  return { subtotal, discount, tax, total: round(subtotal - discount + tax) };
}

/** Totals for a saved invoice row. Uses tax_percent; older rows without it fall back to stored tax. */
export function totalsFromInvoiceRow(inv: {
  subtotal?: number | null; discount_amount?: number | null; tax_total?: number | null;
  tax_percent?: number | null; grand_total?: number | null;
}): InvoiceTotals {
  const subtotal = round(Number(inv.subtotal) || 0);
  const discount = round(Math.min(Math.max(0, Number(inv.discount_amount) || 0), Math.max(0, subtotal)));
  const pct = inv.tax_percent == null ? null : Number(inv.tax_percent);
  const tax = pct == null ? round(Number(inv.tax_total) || 0) : round((subtotal - discount) * pct / 100);
  return { subtotal, discount, tax, total: round(subtotal - discount + tax) };
}

export interface EstimateLineForInvoice {
  title: string; description?: string | null;
  quantity?: number | null; unit_price?: number | null;
  labor_hours?: number | null; labor_rate?: number | null;
  material_cost?: number | null; markup_percent?: number | null;
  tax_percent?: number | null; is_optional?: boolean | null; sort_order?: number | null;
}

export interface InvoiceFromEstimate {
  lines: Array<{ title: string; description: string | null; quantity: number; unit_price: number; line_total: number }>;
  subtotal: number; discount_amount: number; tax_total: number; tax_percent: number; grand_total: number;
}

/** Turn an estimate into invoice values that give the same lines, discount, tax and total to the cent. */
export function buildInvoiceFromEstimate(
  est: { discount_amount?: number | null; discount_percent?: number | null },
  items: EstimateLineForInvoice[],
): InvoiceFromEstimate {
  let rawTax = 0;
  const lines = [...items]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .filter((li) => !li.is_optional)
    .map((li) => {
      const qty = Number(li.quantity) || 1;
      const lineBase = qty * (Number(li.unit_price) || 0)
        + (Number(li.labor_hours) || 0) * (Number(li.labor_rate) || 0)
        + (Number(li.material_cost) || 0);
      const preTax = lineBase * (1 + (Number(li.markup_percent) || 0) / 100);
      rawTax += preTax * ((Number(li.tax_percent) || 0) / 100);
      const line_total = round(preTax);
      return { title: li.title, description: li.description || null, quantity: qty, unit_price: line_total / qty, line_total };
    });
  const subtotal = round(lines.reduce((s, l) => s + l.line_total, 0));
  const { discount, tax, total } = applyDiscountBeforeTax({
    beforeTax: subtotal, taxTotal: rawTax,
    discountAmount: Number(est.discount_amount) || 0, discountPercent: Number(est.discount_percent) || 0,
  });
  const base = subtotal - discount;
  const tax_percent = base > 0 && tax > 0 ? (tax / base) * 100 : 0;
  return { lines, subtotal, discount_amount: discount, tax_total: tax, tax_percent, grand_total: total };
}
