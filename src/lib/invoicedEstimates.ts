// One invoice per estimate: helpers that use the invoice's estimate_id link.

type InvoiceLink = { id: string; estimate_id?: string | null };

/** Map of estimate id -> invoice id for every estimate that already has an invoice. */
export function invoiceByEstimate(invoices: InvoiceLink[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const inv of invoices) if (inv.estimate_id && !m.has(inv.estimate_id)) m.set(inv.estimate_id, inv.id);
  return m;
}

/** Estimates that do not have an invoice yet. */
export function notYetInvoiced<T extends { id: string }>(estimates: T[], invoices: InvoiceLink[]): T[] {
  const done = invoiceByEstimate(invoices);
  return estimates.filter((e) => !done.has(e.id));
}

/** Invoices where the customer has said they paid and the pro has not marked it paid yet. */
export function customerSaysPaid<T extends { status: string; customer_reported_at?: string | null }>(invoices: T[]): T[] {
  return invoices.filter((i) => !!i.customer_reported_at && i.status !== "paid" && i.status !== "cancelled");
}
