// Estimate discount rule, shared by the app and the estimate-share function.
// The discount comes off the amount before tax; tax is charged on what is left.
// No runtime-specific imports so both Deno and the browser can load it.

const round = (n: number) => Math.round(n * 100) / 100;

export function applyDiscountBeforeTax(input: {
  beforeTax: number;
  taxTotal: number;
  discountAmount?: number;
  discountPercent?: number;
}): { discount: number; tax: number; total: number } {
  const beforeTax = Math.max(0, input.beforeTax || 0);
  const rawTax = input.taxTotal || 0;
  const wanted = (input.discountAmount || 0) + beforeTax * ((input.discountPercent || 0) / 100);
  const discount = Math.min(Math.max(0, wanted), beforeTax);
  const tax = beforeTax > 0 ? rawTax * (beforeTax - discount) / beforeTax : 0;
  return { discount: round(discount), tax: round(tax), total: round(beforeTax - discount + tax) };
}

/** Discount implied by stored totals (works for rows saved under any rule: total = before tax + tax - discount). */
export function discountFromStoredTotals(beforeTax: number, taxTotal: number, grandTotal: number): number {
  return Math.max(0, round((beforeTax || 0) + (taxTotal || 0) - (grandTotal || 0)));
}
