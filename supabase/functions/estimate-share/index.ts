import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  buildCustomerPayload, firstName, formatMoney, respondError, shareUrl,
  statusAfterSend, statusAfterView, type EstimateStatus,
} from "./logic.ts";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const Token = z.string().regex(/^[a-f0-9]{64}$/);
const SendSchema = z.object({ action: z.literal("send"), estimateId: z.string().uuid(), channel: z.enum(["email", "link"]) });
const ViewSchema = z.object({ action: z.literal("view"), token: Token });
const RespondSchema = z.object({
  action: z.literal("respond"), token: Token, decision: z.enum(["approved", "declined"]),
  name: z.string().trim().max(200).nullish(), note: z.string().trim().max(1000).nullish(),
});

function newToken() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

async function queueEmail(client: SupabaseClient, templateName: string, recipientEmail: string, idempotencyKey: string, templateData: Record<string, unknown>) {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return false;
  const { error } = await client.functions.invoke("send-transactional-email", {
    headers: { Authorization: `Bearer ${serviceKey}`, "x-internal-service-key": serviceKey },
    body: { templateName, recipientEmail, idempotencyKey, templateData },
  });
  if (error) {
    const response = error.context instanceof Response ? error.context : null;
    const detail = response ? await response.json().catch(() => ({})) : {};
    console.error("Estimate email failed", { templateName, status: response?.status, error: detail.error || error.message });
    return false;
  }
  return true;
}

async function ownerEmail(client: SupabaseClient, userId: string) {
  const { data: owner } = await client.from("profiles").select("email").eq("id", userId).single();
  let email = owner?.email?.trim();
  if (!email) {
    const { data } = await client.auth.admin.getUserById(userId);
    email = data.user?.email?.trim();
  }
  return email || null;
}

const EST_FIELDS = "id,user_id,lead_id,org_id,estimate_number,status,issue_date,expiry_date,job_address,job_type,scope_of_work,notes,terms_conditions,subtotal,tax_total,grand_total,deposit_amount,deposit_percent,approved_at,declined_at,share_token";

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

    // ── Pro sends the estimate ──
    if (body.action === "send") {
      const parsed = SendSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Invalid request" }, 400);
      const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      const { data: authData } = token ? await client.auth.getUser(token) : { data: { user: null } };
      const user = authData?.user;
      if (!user) return json({ error: "Please sign in again." }, 401);

      const { estimateId, channel } = parsed.data;
      const { data: est } = await client.from("estimates").select(EST_FIELDS).eq("id", estimateId).maybeSingle();
      if (!est || est.user_id !== user.id) return json({ error: "Estimate not found" }, 404);
      if (!est.lead_id) return json({ error: "Pick a contact for this estimate first." }, 400);

      const { data: lead } = await client.from("leads").select("id,name,email").eq("id", est.lead_id).maybeSingle();
      const customerEmail = lead?.email?.trim() || null;
      if (channel === "email" && !customerEmail) return json({ error: "Add an email to this contact to send it by email." }, 400);

      let shareToken = est.share_token as string | null;
      if (!shareToken) {
        shareToken = newToken();
        const { error } = await client.from("estimates").update({ share_token: shareToken }).eq("id", est.id);
        if (error) return json({ error: "Couldn't create the link." }, 400);
      }
      const link = shareUrl(shareToken);

      let emailQueued = false;
      if (channel === "email" && customerEmail) {
        const { data: provider } = await client.from("profiles").select("name,company").eq("id", user.id).single();
        emailQueued = await queueEmail(client, "estimate-sent", customerEmail, `estimate-sent-${est.id}-${Date.now()}`, {
          customerName: firstName(lead?.name),
          providerName: provider?.company || provider?.name || "",
          estimateNumber: est.estimate_number,
          totalAmount: formatMoney(est.grand_total),
          expiryDate: est.expiry_date
            ? new Date(`${est.expiry_date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
            : undefined,
          viewUrl: link,
        });
      }

      const next = statusAfterSend(est.status as EstimateStatus);
      if (next !== est.status) {
        await client.from("estimates").update({ status: next, sent_at: new Date().toISOString() }).eq("id", est.id).eq("status", "draft");
      }
      if (lead) {
        await client.from("contact_activities").insert({
          user_id: user.id, lead_id: lead.id, org_id: est.org_id, related_id: est.id,
          activity_type: "estimate_sent",
          title: channel === "email" && emailQueued ? `Estimate ${est.estimate_number} emailed` : `Estimate ${est.estimate_number} shared`,
          description: channel === "email" && emailQueued ? `Sent to ${customerEmail}` : "Link shared with the customer",
        });
      }
      return json({ url: link, emailQueued, customerEmail });
    }

    // ── Customer views the estimate ──
    if (body.action === "view") {
      const parsed = ViewSchema.safeParse(body);
      if (!parsed.success) return json({ error: "This estimate link isn't valid." }, 404);
      const { data: est } = await client.from("estimates").select(EST_FIELDS).eq("share_token", parsed.data.token).maybeSingle();
      if (!est || est.status === "draft") return json({ error: "This estimate link isn't valid." }, 404);

      const next = statusAfterView(est.status as EstimateStatus);
      if (next !== est.status) {
        await client.from("estimates").update({ status: next, viewed_at: new Date().toISOString() }).eq("id", est.id).eq("status", "sent");
        est.status = next;
      }
      const [{ data: sections }, { data: items }, { data: business }, { data: lead }] = await Promise.all([
        client.from("estimate_sections").select("id,name,sort_order").eq("estimate_id", est.id),
        client.from("estimate_line_items").select("section_id,title,description,quantity,unit,line_total,tax_percent,is_optional,sort_order").eq("estimate_id", est.id),
        client.from("profiles").select("company,name,handle,phone,avatar_url").eq("id", est.user_id).single(),
        est.lead_id ? client.from("leads").select("name").eq("id", est.lead_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      return json({ estimate: buildCustomerPayload(est, sections ?? [], items ?? [], business ?? {}, (lead as any)?.name) });
    }

    // ── Customer approves or declines ──
    if (body.action === "respond") {
      const parsed = RespondSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Please check your answer and try again." }, 400);
      const { token, decision, name, note } = parsed.data;
      const { data: est } = await client.from("estimates").select(EST_FIELDS).eq("share_token", token).maybeSingle();
      if (!est) return json({ error: "This estimate link isn't valid." }, 404);
      const problem = respondError(est as any, decision, name);
      if (problem) return json({ error: problem }, 409);

      const now = new Date().toISOString();
      const { data: updated, error } = await client.from("estimates").update({
        status: decision,
        ...(decision === "approved" ? { approved_at: now } : { declined_at: now }),
        response_name: name || null,
        response_note: note || null,
      }).eq("id", est.id).in("status", ["sent", "viewed"]).select("id").maybeSingle();
      if (error || !updated) return json({ error: "This estimate already has a response." }, 409);

      const { data: lead } = est.lead_id ? await client.from("leads").select("id,name").eq("id", est.lead_id).maybeSingle() : { data: null };
      const who = (name || "").trim() || lead?.name || "Your customer";
      if (lead) {
        await client.from("contact_activities").insert({
          user_id: est.user_id, lead_id: lead.id, org_id: est.org_id, related_id: est.id,
          activity_type: decision === "approved" ? "estimate_approved" : "estimate_declined",
          title: `Estimate ${est.estimate_number} ${decision} by ${who}`,
          description: note || null,
        });
      }
      const to = await ownerEmail(client, est.user_id);
      if (to) {
        await queueEmail(client, "estimate-response", to, `estimate-response-${est.id}`, {
          customerName: who, decision, estimateNumber: est.estimate_number,
          totalAmount: formatMoney(est.grand_total), note: note || null,
        });
      } else {
        console.warn("Estimate response email skipped: no owner email", { estimateId: est.id });
      }
      return json({ success: true, status: decision, responded_at: now });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("estimate-share error:", err instanceof Error ? err.message : err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
