import { describe, it, expect } from "vitest";
import {
  buildInvoicePayload, buildReportUpdate, reportError, shouldEmailReport, statusAfterView, isValidToken,
} from "../../supabase/functions/_shared/invoice-share/logic";
import { notYetInvoiced, invoiceByEstimate, customerSaysPaid } from "@/lib/invoicedEstimates";

const row = {
  id: "inv-1", user_id: "u-1", lead_id: "l-1", org_id: "o-1", invoice_number: "INV-1", status: "sent",
  issue_date: "2026-11-01", due_date: "2026-11-15", subtotal: 100, discount_amount: 0, tax_total: 13, grand_total: 113,
  amount_paid: 0, paid_at: null, notes: "Thanks", terms: "14 days", payment_token: "tok",
  stripe_payment_intent_id: "pi_123", internal_notes: "secret",
};

describe("invoice-share view payload", () => {
  const payload = buildInvoicePayload(
    row,
    [{ id: "li", invoice_id: "inv-1", title: "Paint", quantity: 1, unit_price: 100, line_total: 100 }],
    [{ id: "p", user_id: "u-1", invoice_id: "inv-1", amount: 50, payment_method: "cash", paid_at: "2026-11-02", notes: "x" }],
    { company: "", name: "Zak", handle: "zak", phone: "555", avatar_url: null, email: "pro@x.com" } as any,
    { name: "Sam", company: "Acme", email: "sam@x.com", phone: "123", id: "l-1" } as any,
  );
  const text = JSON.stringify(payload);
  it("contains none of the forbidden fields", () => {
    for (const bad of ["user_id", "lead_id", "org_id", "payment_token", "stripe_payment_intent", "pi_123", "internal_notes", "sam@x.com", "123\"", "pro@x.com", "\"id\""]) {
      expect(text).not.toContain(bad);
    }
  });
  it("falls back to the profile name for the business", () => {
    expect(payload.business.name).toBe("Zak");
  });
});

describe("invoice status after view", () => {
  it("sent becomes viewed, then stays viewed", () => {
    expect(statusAfterView("sent")).toBe("viewed");
    expect(statusAfterView(statusAfterView("sent"))).toBe("viewed");
  });
  it("other statuses do not change", () => {
    for (const s of ["draft", "paid", "overdue", "cancelled"] as const) expect(statusAfterView(s)).toBe(s);
  });
});

describe("report_payment", () => {
  it("only touches the customer report columns", () => {
    const u = buildReportUpdate({ method: "e_transfer", reference: "12345", note: "sent" });
    expect(Object.keys(u).sort()).toEqual([
      "customer_reported_at", "customer_reported_method", "customer_reported_note", "customer_reported_reference",
    ]);
    expect(u).not.toHaveProperty("status");
    expect(u).not.toHaveProperty("amount_paid");
    expect(u).not.toHaveProperty("paid_at");
  });
  it("is refused on paid or cancelled invoices", () => {
    expect(reportError("paid")).toBeTruthy();
    expect(reportError("cancelled")).toBeTruthy();
    expect(reportError("sent")).toBeNull();
    expect(reportError("overdue")).toBeNull();
  });
  it("emails again only when method or reference changed", () => {
    const prev = { customer_reported_at: "x", customer_reported_method: "cash", customer_reported_reference: null };
    expect(shouldEmailReport(prev, { customer_reported_method: "cash", customer_reported_reference: null })).toBe(false);
    expect(shouldEmailReport(prev, { customer_reported_method: "e_transfer", customer_reported_reference: null })).toBe(true);
    expect(shouldEmailReport(prev, { customer_reported_method: "cash", customer_reported_reference: "9" })).toBe(true);
    expect(shouldEmailReport({}, { customer_reported_method: "cash", customer_reported_reference: null })).toBe(true);
  });
  it("only accepts uuid tokens", () => {
    expect(isValidToken("e3bb2441-eb13-4f20-9aea-f6bda1795278")).toBe(true);
    expect(isValidToken("nope")).toBe(false);
  });
});

describe("already invoiced filter", () => {
  const estimates = [{ id: "e1" }, { id: "e2" }, { id: "e3" }];
  const invoices = [{ id: "i1", estimate_id: "e2" }, { id: "i2", estimate_id: null }];
  it("hides estimates that already have an invoice", () => {
    expect(notYetInvoiced(estimates, invoices).map((e) => e.id)).toEqual(["e1", "e3"]);
  });
  it("finds the invoice for an estimate", () => {
    expect(invoiceByEstimate(invoices).get("e2")).toBe("i1");
  });
  it("lists unpaid invoices the customer says are paid", () => {
    const list = [
      { status: "sent", customer_reported_at: "x" },
      { status: "paid", customer_reported_at: "x" },
      { status: "viewed", customer_reported_at: null },
    ];
    expect(customerSaysPaid(list)).toHaveLength(1);
  });
});
