import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

      if (profile?.email) {
        // Fetch quote request details
        const { data: quoteReq } = await supabase
          .from("marketplace_quote_requests")
          .select("customer_name, service_needed")
          .eq("id", log.quote_request_id)
          .single();

        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: profile.email,
              subject: `⏰ Reminder: ${quoteReq?.customer_name || "A customer"} is waiting for your response`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #1a1a1a;">Don't miss this lead!</h2>
                  <p>${quoteReq?.customer_name || "A potential customer"} requested a quote${quoteReq?.service_needed ? ` for <strong>${quoteReq.service_needed}</strong>` : ""} 1 hour ago and hasn't heard back yet.</p>
                  <p style="color: #666;">Businesses that respond within 1 hour are <strong>7x more likely</strong> to win the job.</p>
                  <p><a href="https://card-pilot-suite.lovable.app/app/contacts" style="background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Respond Now</a></p>
                </div>
              `,
            },
          });
        } catch (_) { /* best effort */ }
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

      if (profile?.email) {
        const { data: quoteReq } = await supabase
          .from("marketplace_quote_requests")
          .select("customer_name, service_needed")
          .eq("id", log.quote_request_id)
          .single();

        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: profile.email,
              subject: `🚨 Final reminder: ${quoteReq?.customer_name || "A customer"} may go elsewhere`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #dc2626;">You're about to lose this lead</h2>
                  <p>${quoteReq?.customer_name || "A potential customer"} has been waiting <strong>24 hours</strong> for a response${quoteReq?.service_needed ? ` about <strong>${quoteReq.service_needed}</strong>` : ""}.</p>
                  <p style="color: #666;">This is your last reminder. After this, the lead may choose another provider.</p>
                  <p><a href="https://card-pilot-suite.lovable.app/app/contacts" style="background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Respond Now Before It's Too Late</a></p>
                </div>
              `,
            },
          });
        } catch (_) { /* best effort */ }
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
