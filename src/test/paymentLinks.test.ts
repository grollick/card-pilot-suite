import { describe, it, expect } from "vitest";
import { normalizePaypalMe, normalizeStripeLink, buildPayOnline, ONLINE_PAYMENT_PLANS } from "@/lib/paymentLinks";
import { PLAN_CONFIGS } from "@/modules/billing/config/planLimits";

describe("PayPal.Me link", () => {
  it("accepts and cleans good links", () => {
    for (const s of ["paypal.me/yourname", "https://paypal.me/yourname", "http://www.paypal.me/yourname/", "https://www.paypal.com/paypalme/yourname", "paypal.com/paypalme/yourname"]) {
      expect(normalizePaypalMe(s)).toBe("https://paypal.me/yourname");
    }
  });
  it("refuses bad links", () => {
    for (const s of ["", "yourname", "paypal.com/yourname", "https://evil.com/paypal.me/x", "paypal.me/", "paypal.me/a/b"]) {
      expect(normalizePaypalMe(s)).toBeNull();
    }
  });
});

describe("Stripe payment link", () => {
  it("accepts https buy.stripe.com links", () => {
    expect(normalizeStripeLink(" https://buy.stripe.com/abc123 ")).toBe("https://buy.stripe.com/abc123");
  });
  it("refuses everything else", () => {
    for (const s of ["http://buy.stripe.com/abc", "https://stripe.com/abc", "buy.stripe.com/abc", "https://buy.stripe.com.evil.com/x", "https://buy.stripe.com/"]) {
      expect(normalizeStripeLink(s)).toBeNull();
    }
  });
});

describe("pay_online", () => {
  const pro = { paypal_me_url: "https://paypal.me/yourname", stripe_payment_link: "https://buy.stripe.com/abc" };
  const open = { status: "sent", grand_total: 2034, amount_paid: 0 };
  it("is null for a free plan even when links are saved", () => {
    expect(buildPayOnline(open, pro, "free")).toEqual({ paypal_url: null, stripe_url: null });
    expect(buildPayOnline(open, pro, "starter")).toEqual({ paypal_url: null, stripe_url: null });
  });
  it("is null on paid and cancelled invoices", () => {
    expect(buildPayOnline({ ...open, status: "paid" }, pro, "pro")).toEqual({ paypal_url: null, stripe_url: null });
    expect(buildPayOnline({ ...open, status: "cancelled" }, pro, "pro")).toEqual({ paypal_url: null, stripe_url: null });
  });
  it("PayPal link carries the balance with two decimals; Stripe link as saved", () => {
    expect(buildPayOnline(open, pro, "pro")).toEqual({ paypal_url: "https://paypal.me/yourname/2034.00", stripe_url: "https://buy.stripe.com/abc" });
    expect(buildPayOnline({ ...open, amount_paid: 1000.5 }, pro, "pro_plus").paypal_url).toBe("https://paypal.me/yourname/1033.50");
  });
  it("server plan list matches PLAN_CONFIGS", () => {
    const paid = Object.values(PLAN_CONFIGS).filter((p) => p.features.online_invoice_payments).map((p) => p.key).sort();
    expect([...ONLINE_PAYMENT_PLANS].sort()).toEqual(paid);
    expect(PLAN_CONFIGS.free.features.online_invoice_payments).toBe(false);
  });
});
