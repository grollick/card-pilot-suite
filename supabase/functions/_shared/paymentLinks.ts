// The pro's own PayPal.Me and Stripe Payment Link. Shared by the app and invoice-share.
// guzzl.pro never handles the money: the customer pays on PayPal's or Stripe's page.

/** Plans with online_invoice_payments. Must match PLAN_CONFIGS in planLimits.ts (a test checks this). */
export const ONLINE_PAYMENT_PLANS = ["pro", "growth", "pro_plus"];
export const planHasOnlinePayments = (plan?: string | null) => ONLINE_PAYMENT_PLANS.includes((plan || "").toLowerCase());

/** Returns https://paypal.me/<name>, or null when it isn't a PayPal.Me link. */
export function normalizePaypalMe(input: string): string | null {
  const s = (input || "").trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/[/?#]+$/, "");
  const m = s.match(/^(?:paypal\.me|paypal\.com\/paypalme)\/([A-Za-z0-9]{1,64})$/i);
  return m ? `https://paypal.me/${m[1]}` : null;
}

/** Returns the link as typed (trimmed) when it's an https link on buy.stripe.com, otherwise null. */
export function normalizeStripeLink(input: string): string | null {
  const s = (input || "").trim();
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" || u.hostname.toLowerCase() !== "buy.stripe.com" || u.pathname.length < 2) return null;
    return s;
  } catch {
    return null;
  }
}

/** What the customer page may show. Null links unless the plan allows it and the invoice is still open. */
export function buildPayOnline(
  inv: { status: string; grand_total?: unknown; amount_paid?: unknown },
  pro: { paypal_me_url?: string | null; stripe_payment_link?: string | null },
  plan: string | null | undefined,
): { paypal_url: string | null; stripe_url: string | null } {
  const none = { paypal_url: null, stripe_url: null };
  if (!planHasOnlinePayments(plan) || inv.status === "paid" || inv.status === "cancelled") return none;
  const balance = Math.max(0, (Number(inv.grand_total) || 0) - (Number(inv.amount_paid) || 0));
  if (balance <= 0) return none;
  const paypal = pro.paypal_me_url ? normalizePaypalMe(pro.paypal_me_url) : null;
  const stripe = pro.stripe_payment_link ? normalizeStripeLink(pro.stripe_payment_link) : null;
  return {
    paypal_url: paypal ? `${paypal}/${balance.toFixed(2)}` : null,
    stripe_url: stripe,
  };
}
