import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { buildInvoicePayload, REPORT_METHODS, statusAfterView, type InvoiceStatus } from "./logic.ts";
import { INV_FIELDS, reportPayment } from "../_shared/invoice-share/report.ts";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BAD_LINK = "This invoice link isn't working. Please ask the business that sent it for a new link.";
const Token = z.string().uuid();
const ViewSchema = z.object({ action: z.literal("view"), token: Token });
const ReportSchema = z.object({
  action: z.literal("report_payment"), token: Token, method: z.enum(REPORT_METHODS),
  reference: z.string().trim().max(200).nullish(), note: z.string().trim().max(1000).nullish(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid request" }, 400);
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) throw new Error("Missing server configuration");
    const client = createClient(url, serviceKey);

    if (body.action === "view") {
      const parsed = ViewSchema.safeParse(body);
      if (!parsed.success) return json({ error: BAD_LINK }, 404);
      const { data: inv } = await client.from("invoices").select(INV_FIELDS).eq("payment_token", parsed.data.token).maybeSingle();
      if (!inv) return json({ error: BAD_LINK }, 404);
      const next = statusAfterView(inv.status as InvoiceStatus);
      if (next !== inv.status) {
        await client.from("invoices").update({ status: next, viewed_at: new Date().toISOString() }).eq("id", inv.id).eq("status", "sent");
        inv.status = next;
      }
      const [{ data: items }, { data: payments }, { data: business }, { data: lead }] = await Promise.all([
        client.from("invoice_line_items").select("title,description,quantity,unit_price,line_total,sort_order").eq("invoice_id", inv.id).order("sort_order"),
        client.from("invoice_payments").select("amount,payment_method,paid_at").eq("invoice_id", inv.id).order("paid_at"),
        client.from("profiles").select("company,name,handle,phone,avatar_url").eq("id", inv.user_id).single(),
        inv.lead_id ? client.from("leads").select("name,company").eq("id", inv.lead_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      return json({ invoice: buildInvoicePayload(inv, items ?? [], payments ?? [], business ?? {}, lead as any) });
    }

    if (body.action === "report_payment") {
      const parsed = ReportSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Please check what you entered and try again." }, 400);
      const { token, method, reference, note } = parsed.data;
      const r = await reportPayment(client, token, { method, reference, note });
      return json(r.body, r.status);
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("invoice-share error:", err instanceof Error ? err.message : err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
