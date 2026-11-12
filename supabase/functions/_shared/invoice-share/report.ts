// Shared "customer says they paid" handler, used by invoice-share and record-invoice-payment.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildReportUpdate, formatMoney, methodLabel, reportError, shouldEmailReport, type InvoiceStatus, type ReportMethod,
} from "./logic.ts";

export const INV_FIELDS = "id,user_id,lead_id,org_id,invoice_number,status,issue_date,due_date,subtotal,discount_amount,tax_total,grand_total,amount_paid,paid_at,notes,terms,customer_reported_at,customer_reported_method,customer_reported_reference,customer_reported_note,viewed_at";

function runInBackground(task: () => Promise<unknown>) {
  const work = task().catch((e) => console.error("Background email task failed:", e));
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) { rt.waitUntil(work); return null; }
  return work;
}

async function notifyOwner(client: SupabaseClient, userId: string, idempotencyKey: string, templateData: Record<string, unknown>) {
  const { data: owner } = await client.from("profiles").select("email").eq("id", userId).single();
  let recipientEmail = owner?.email?.trim();
  if (!recipientEmail) {
    const { data } = await client.auth.admin.getUserById(userId);
    recipientEmail = data.user?.email?.trim();
  }
  if (!recipientEmail) { console.warn("Payment report email skipped: no owner email", { userId }); return; }
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return;
  const { error } = await client.functions.invoke("send-transactional-email", {
    headers: { Authorization: `Bearer ${serviceKey}`, "x-internal-service-key": serviceKey },
    body: { templateName: "invoice-payment-reported", recipientEmail, idempotencyKey, templateData },
  });
  if (error) {
    const response = error.context instanceof Response ? error.context : null;
    const detail = response ? await response.json().catch(() => ({})) : {};
    console.error("Payment report email failed", { status: response?.status, error: detail.error || error.message });
  }
}

/** Saves the customer's report. Never touches status, amount_paid, paid_at or invoice_payments. */
export async function reportPayment(
  client: SupabaseClient, token: string,
  input: { method: ReportMethod; reference?: string | null; note?: string | null },
): Promise<{ status: number; body: Record<string, unknown> }> {
  const { data: inv } = await client.from("invoices").select(INV_FIELDS).eq("payment_token", token).maybeSingle();
  if (!inv) return { status: 404, body: { error: "This invoice link isn't working. Please ask the business that sent it for a new link." } };
  const problem = reportError(inv.status as InvoiceStatus);
  if (problem) return { status: 409, body: { error: problem } };

  const update = buildReportUpdate(input);
  const sendEmail = shouldEmailReport(inv, update);
  const { error } = await client.from("invoices").update(update).eq("id", inv.id).not("status", "in", "(paid,cancelled)");
  if (error) return { status: 400, body: { error: "Couldn't save that. Please try again." } };

  const { data: lead } = inv.lead_id ? await client.from("leads").select("id,name").eq("id", inv.lead_id).maybeSingle() : { data: null };
  if (lead) {
    await client.from("contact_activities").insert({
      user_id: inv.user_id, lead_id: lead.id, org_id: inv.org_id, related_id: inv.id,
      activity_type: "invoice_payment_reported",
      title: `Customer says they paid invoice ${inv.invoice_number} by ${methodLabel(input.method)}`,
      description: [update.customer_reported_reference && `Ref: ${update.customer_reported_reference}`, update.customer_reported_note].filter(Boolean).join(" · ") || null,
    });
  }
  if (sendEmail) {
    const balance = Math.max(0, Number(inv.grand_total ?? 0) - Number(inv.amount_paid ?? 0));
    const pending = runInBackground(() => notifyOwner(client, inv.user_id, `invoice-payment-reported-${inv.id}-${update.customer_reported_at}`, {
      customerName: lead?.name || "Your customer",
      invoiceNumber: inv.invoice_number,
      amount: formatMoney(balance),
      method: methodLabel(input.method),
      reference: update.customer_reported_reference,
      note: update.customer_reported_note,
      invoiceUrl: `https://guzzl.pro/app/invoices/${inv.id}`,
    }));
    if (pending) await pending;
  }
  return { status: 200, body: { success: true, ...update } };
}
