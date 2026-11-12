// Pure rules for customer estimate sharing. No runtime-specific imports so tests can load it.

export type EstimateStatus = "draft" | "sent" | "viewed" | "approved" | "declined" | "expired";

export const SITE_URL = "https://guzzl.pro";
export const shareUrl = (token: string) => `${SITE_URL}/estimate/${token}`;

export function formatMoney(n: unknown): string {
  const v = Number(n ?? 0);
  return `$${(Number.isFinite(v) ? v : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const firstName = (name?: string | null) => (name || "").trim().split(/\s+/)[0] || "";

/** True when the expiry date (YYYY-MM-DD, valid through the end of that day) has passed. */
export function isExpired(expiryDate: string | null | undefined, now = new Date()): boolean {
  if (!expiryDate) return false;
  const end = new Date(`${expiryDate}T23:59:59`);
  return !isNaN(end.getTime()) && now.getTime() > end.getTime();
}

/** Status after the pro sends: only a draft moves to sent; never move backwards. */
export function statusAfterSend(status: EstimateStatus): EstimateStatus {
  return status === "draft" ? "sent" : status;
}

/** Status after the customer opens the link: sent becomes viewed once. */
export function statusAfterView(status: EstimateStatus): EstimateStatus {
  return status === "sent" ? "viewed" : status;
}

/** Returns an error message when the customer cannot respond, otherwise null. */
export function respondError(
  est: { status: EstimateStatus; expiry_date?: string | null },
  decision: "approved" | "declined",
  name: string | null | undefined,
  now = new Date(),
): string | null {
  if (est.status === "approved" || est.status === "declined") return "This estimate already has a response.";
  if (est.status === "draft") return "This estimate link isn't valid.";
  if (est.status === "expired" || isExpired(est.expiry_date, now)) return "This estimate has expired.";
  if (decision === "approved" && !(name || "").trim()) return "Please type your full name to approve.";
  return null;
}

const num = (v: unknown) => Number(v ?? 0) || 0;

/** Builds the only data a customer may see. Whitelist only — never spread estimate rows. */
export function buildCustomerPayload(
  est: Record<string, any>,
  sections: Array<Record<string, any>>,
  items: Array<Record<string, any>>,
  business: { company?: string | null; name?: string | null; handle?: string | null; phone?: string | null; avatar_url?: string | null },
  customerName: string | null | undefined,
) {
  const subtotal = num(est.subtotal);
  const tax = num(est.tax_total);
  const grand = num(est.grand_total);
  const discount = Math.max(0, Math.round((subtotal + tax - grand) * 100) / 100);
  const deposit = num(est.deposit_amount) > 0 ? num(est.deposit_amount)
    : num(est.deposit_percent) > 0 ? Math.round(grand * num(est.deposit_percent)) / 100 : 0;
  const mapItem = (li: Record<string, any>) => ({
    title: String(li.title ?? ""),
    description: li.description ?? null,
    quantity: num(li.quantity),
    unit: li.unit ?? null,
    line_total: num(li.line_total),
    is_optional: !!li.is_optional,
  });
  const sorted = [...items].sort((a, b) => num(a.sort_order) - num(b.sort_order));
  const outSections = [...sections].sort((a, b) => num(a.sort_order) - num(b.sort_order)).map((s) => ({
    title: String(s.name ?? ""),
    items: sorted.filter((li) => li.section_id === s.id).map(mapItem),
  }));
  const loose = sorted.filter((li) => !li.section_id || !sections.some((s) => s.id === li.section_id));
  if (loose.length) outSections.push({ title: "", items: loose.map(mapItem) });

  const status: EstimateStatus = (est.status === "sent" || est.status === "viewed") && isExpired(est.expiry_date) ? "expired" : est.status;
  return {
    estimate_number: String(est.estimate_number ?? ""),
    status,
    issue_date: est.issue_date ?? null,
    expiry_date: est.expiry_date ?? null,
    responded_at: est.approved_at ?? est.declined_at ?? null,
    job_address: est.job_address ?? null,
    job_type: est.job_type ?? null,
    scope_of_work: est.scope_of_work ?? null,
    notes: est.notes ?? null,
    terms_conditions: est.terms_conditions ?? null,
    subtotal, discount, tax_total: tax, grand_total: grand,
    deposit: deposit > 0 ? deposit : null,
    sections: outSections,
    customer_first_name: firstName(customerName),
    business: {
      name: business.company || business.name || "",
      handle: business.handle ?? null,
      phone: business.phone ?? null,
      avatar_url: business.avatar_url ?? null,
    },
  };
}
