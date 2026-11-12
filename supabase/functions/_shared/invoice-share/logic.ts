// Pure rules for the customer invoice link. No runtime-specific imports so tests can load it.

export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";
export const REPORT_METHODS = ["e_transfer", "cash", "check", "bank_transfer", "paypal", "card", "other"] as const;
export type ReportMethod = typeof REPORT_METHODS[number];

export const METHOD_LABELS: Record<ReportMethod, string> = {
  e_transfer: "e-transfer", cash: "cash", check: "cheque", bank_transfer: "bank transfer", paypal: "PayPal", card: "card", other: "another way",
};
export const methodLabel = (m?: string | null) => METHOD_LABELS[m as ReportMethod] ?? "another way";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isValidToken = (t: unknown): t is string => typeof t === "string" && UUID_RE.test(t);

export function formatMoney(n: unknown): string {
  const v = Number(n ?? 0);
  return `$${(Number.isFinite(v) ? v : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Sent becomes viewed the first time the link is opened. Nothing else changes. */
export function statusAfterView(status: InvoiceStatus): InvoiceStatus {
  return status === "sent" ? "viewed" : status;
}

/** Returns a message when the customer cannot report a payment, otherwise null. */
export function reportError(status: InvoiceStatus): string | null {
  if (status === "paid") return "This invoice is already paid.";
  if (status === "cancelled") return "This invoice was cancelled.";
  return null;
}

/** Only these columns may change when a customer reports a payment. Never status, amount_paid or paid_at. */
export function buildReportUpdate(input: { method: ReportMethod; reference?: string | null; note?: string | null }, now = new Date()) {
  return {
    customer_reported_at: now.toISOString(),
    customer_reported_method: input.method,
    customer_reported_reference: (input.reference || "").trim().slice(0, 200) || null,
    customer_reported_note: (input.note || "").trim().slice(0, 1000) || null,
  };
}

/** Email the pro again only when the method or reference changed. */
export function shouldEmailReport(
  prev: { customer_reported_at?: string | null; customer_reported_method?: string | null; customer_reported_reference?: string | null },
  next: { customer_reported_method: string; customer_reported_reference: string | null },
): boolean {
  if (!prev.customer_reported_at) return true;
  return (prev.customer_reported_method ?? null) !== next.customer_reported_method
    || (prev.customer_reported_reference ?? null) !== next.customer_reported_reference;
}

const num = (v: unknown) => Number(v ?? 0) || 0;

/** The only data a customer may see. Whitelist only — never spread rows. */
export function buildInvoicePayload(
  inv: Record<string, any>,
  items: Array<Record<string, any>>,
  payments: Array<Record<string, any>>,
  business: { company?: string | null; name?: string | null; handle?: string | null; phone?: string | null; avatar_url?: string | null },
  customer: { name?: string | null; company?: string | null } | null,
) {
  return {
    invoice_number: inv.invoice_number,
    status: inv.status,
    issue_date: inv.issue_date ?? null,
    due_date: inv.due_date ?? null,
    subtotal: num(inv.subtotal),
    discount_amount: num(inv.discount_amount),
    tax_total: num(inv.tax_total),
    grand_total: num(inv.grand_total),
    amount_paid: num(inv.amount_paid),
    paid_at: inv.paid_at ?? null,
    notes: inv.notes ?? null,
    terms: inv.terms ?? null,
    customer_reported_at: inv.customer_reported_at ?? null,
    customer_reported_method: inv.customer_reported_method ?? null,
    customer_reported_reference: inv.customer_reported_reference ?? null,
    customer_reported_note: inv.customer_reported_note ?? null,
    pay_online: inv.pay_online ?? { paypal_url: null, stripe_url: null },
    customer: { name: customer?.name ?? null, company: customer?.company ?? null },
    business: {
      name: (business.company || "").trim() || (business.name || "").trim() || "Your pro",
      phone: business.phone ?? null,
      handle: business.handle ?? null,
      logo_url: business.avatar_url ?? null,
    },
    line_items: items.map((li) => ({
      title: li.title, description: li.description ?? null,
      quantity: num(li.quantity), unit_price: num(li.unit_price), line_total: num(li.line_total),
    })),
    payments: payments.map((p) => ({ amount: num(p.amount), payment_method: p.payment_method ?? null, paid_at: p.paid_at })),
  };
}
