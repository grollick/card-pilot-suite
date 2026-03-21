import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { payment_token, payment_method, payment_reference, notes } = await req.json();

    if (!payment_token || typeof payment_token !== "string") {
      return new Response(JSON.stringify({ error: "Missing payment token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedMethods = ["bank_transfer", "cash", "check", "e_transfer", "other"];
    if (!payment_method || !allowedMethods.includes(payment_method)) {
      return new Response(JSON.stringify({ error: "Invalid payment method" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate token and get invoice
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("id, user_id, lead_id, invoice_number, grand_total, amount_paid, status, payment_token")
      .eq("payment_token", payment_token)
      .single();

    if (invErr || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (invoice.status === "paid") {
      return new Response(JSON.stringify({ error: "Invoice already paid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const grandTotal = Number(invoice.grand_total ?? 0);
    const amountPaid = Number(invoice.amount_paid ?? 0);
    const remainingBalance = Math.max(0, grandTotal - amountPaid);

    if (remainingBalance <= 0) {
      return new Response(JSON.stringify({ error: "No balance remaining" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize optional text fields
    const safeRef = payment_reference ? String(payment_reference).slice(0, 200) : null;
    const safeNotes = notes ? String(notes).slice(0, 1000) : null;

    // Insert payment record
    const { error: payErr } = await supabase.from("invoice_payments").insert({
      invoice_id: invoice.id,
      user_id: invoice.user_id,
      amount: remainingBalance,
      payment_method,
      payment_reference: safeRef,
      notes: safeNotes,
    });

    if (payErr) {
      console.error("Payment insert error:", payErr);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update invoice
    const { error: updErr } = await supabase
      .from("invoices")
      .update({
        amount_paid: grandTotal,
        payment_method,
        payment_reference: safeRef,
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);

    if (updErr) {
      console.error("Invoice update error:", updErr);
    }

    // Log CRM activity
    if (invoice.lead_id) {
      await supabase.from("contact_activities").insert({
        lead_id: invoice.lead_id,
        user_id: invoice.user_id,
        activity_type: "invoice_paid",
        title: `Invoice ${invoice.invoice_number} paid via ${payment_method}`,
        related_id: invoice.id,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("record-invoice-payment error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
