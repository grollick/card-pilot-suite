// Kept for links on screens published before Batch L. It no longer marks invoices paid:
// it only records what the customer says they sent, exactly like invoice-share report_payment.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { isValidToken, REPORT_METHODS, type ReportMethod } from "../_shared/invoice-share/logic.ts";
import { reportPayment } from "../_shared/invoice-share/report.ts";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid request" }, 400);
    const { payment_token, payment_method, payment_reference, notes } = body as Record<string, unknown>;
    if (!isValidToken(payment_token)) return json({ error: "Missing payment token" }, 400);
    if (!REPORT_METHODS.includes(payment_method as ReportMethod)) return json({ error: "Invalid payment method" }, 400);
    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const r = await reportPayment(client, payment_token, {
      method: payment_method as ReportMethod,
      reference: typeof payment_reference === "string" ? payment_reference : null,
      note: typeof notes === "string" ? notes : null,
    });
    return json(r.body, r.status);
  } catch (err) {
    console.error("record-invoice-payment error:", err instanceof Error ? err.message : err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
