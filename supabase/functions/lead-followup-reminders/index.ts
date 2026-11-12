import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function queueReminder(
  supabase: any, recipientEmail: string, idempotencyKey: string,
  leadName: string | null | undefined, service: string | null | undefined, leadId: string | null,
) {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return;
  const { error } = await supabase.functions.invoke("send-transactional-email", {
    headers: { Authorization: `Bearer ${serviceKey}`, "x-internal-service-key": serviceKey },
    body: { templateName: "lead-reminder", recipientEmail, idempotencyKey, templateData: { leadName, service } },
  });
  if (error) console.error("Lead reminder email failed", { leadId, error: error.message });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();

    // 1. Find leads delivered > 1 hour ago with no response and no 1h reminder sent
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const { data: needsReminder1h } = await supabase
      .from("lead_routing_log")
      .select("id, user_id, lead_id, quote_request_id")
      .eq("status", "delivered")
      .eq("reminder_1h_sent", false)
      .lt("delivered_at", oneHourAgo)
      .is("responded_at", null);

    let remindersSent = 0;

    for (const log of needsReminder1h ?? []) {
      // Fetch business email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("id", log.user_id)
        .single();

      let recipientEmail = profile?.email?.trim();
      if (!recipientEmail) {
        const { data } = await supabase.auth.admin.getUserById(log.user_id);
        recipientEmail = data.user?.email?.trim();
      }
      if (!recipientEmail) console.warn("Lead follow-up reminder skipped: no profile or account email", { leadId: log.lead_id });

      if (recipientEmail) {
        // Fetch quote request details
        const { data: quoteReq } = await supabase
          .from("marketplace_quote_requests")
          .select("customer_name, service_needed")
          .eq("id", log.quote_request_id)
          .single();

        await queueReminder(supabase, recipientEmail, `lead-reminder-1h-${log.id}`, quoteReq?.customer_name, quoteReq?.service_needed, log.lead_id);
      }

      // Log reminder activity
      if (log.lead_id) {
        await supabase.from("contact_activities").insert({
          user_id: log.user_id,
          lead_id: log.lead_id,
          activity_type: "reminder",
          title: "⏰ 1-hour follow-up reminder sent",
          occurred_at: now.toISOString(),
        });
      }

      // Mark reminder as sent
      await supabase
        .from("lead_routing_log")
        .update({ reminder_1h_sent: true })
        .eq("id", log.id);

      remindersSent++;
    }

    // 2. Find leads delivered > 24 hours ago with no response and no 24h reminder sent
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { data: needsReminder24h } = await supabase
      .from("lead_routing_log")
      .select("id, user_id, lead_id, quote_request_id")
      .eq("status", "delivered")
      .eq("reminder_24h_sent", false)
      .lt("delivered_at", twentyFourHoursAgo)
      .is("responded_at", null);

    for (const log of needsReminder24h ?? []) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("id", log.user_id)
        .single();

      let recipientEmail = profile?.email?.trim();
      if (!recipientEmail) {
        const { data } = await supabase.auth.admin.getUserById(log.user_id);
        recipientEmail = data.user?.email?.trim();
      }
      if (!recipientEmail) console.warn("Lead follow-up reminder skipped: no profile or account email", { leadId: log.lead_id });

      if (recipientEmail) {
        const { data: quoteReq } = await supabase
          .from("marketplace_quote_requests")
          .select("customer_name, service_needed")
          .eq("id", log.quote_request_id)
          .single();

        await queueReminder(supabase, recipientEmail, `lead-reminder-24h-${log.id}`, quoteReq?.customer_name, quoteReq?.service_needed, log.lead_id);
      }

      if (log.lead_id) {
        await supabase.from("contact_activities").insert({
          user_id: log.user_id,
          lead_id: log.lead_id,
          activity_type: "reminder",
          title: "🚨 24-hour final reminder sent",
          occurred_at: now.toISOString(),
        });
      }

      await supabase
        .from("lead_routing_log")
        .update({ reminder_24h_sent: true })
        .eq("id", log.id);

      remindersSent++;
    }

    return new Response(JSON.stringify({ remindersSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("lead-followup-reminders error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
