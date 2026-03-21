import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  // Auth guard: only allow calls with service role key or anon key
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  if (token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") && token !== Deno.env.get("SUPABASE_ANON_KEY")) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find expired pending matches
    const now = new Date().toISOString();
    const { data: expired } = await supabase
      .from("estimate_matches")
      .select("id, user_id, estimate_request_id, lead_id")
      .eq("status", "pending")
      .lt("response_deadline_at", now);

    let expiredCount = 0;

    for (const match of expired ?? []) {
      // Mark as expired
      await supabase
        .from("estimate_matches")
        .update({ status: "expired", updated_at: now })
        .eq("id", match.id);

      // Update missed count on duty status
      await supabase.rpc("increment_missed_leads", { p_user_id: match.user_id }).catch(async () => {
        const { data: current } = await supabase
          .from("estimate_duty_status")
          .select("missed_leads_count")
          .eq("user_id", match.user_id)
          .single();
        await supabase
          .from("estimate_duty_status")
          .update({
            missed_leads_count: ((current as any)?.missed_leads_count ?? 0) + 1,
            updated_at: now,
          })
          .eq("user_id", match.user_id);
      });

      // Log missed event
      await supabase.from("estimate_duty_log").insert({
        user_id: match.user_id,
        lead_id: match.lead_id,
        event_type: "missed",
        was_on_duty: true,
      });

      expiredCount++;
    }

    return new Response(
      JSON.stringify({ expired: expiredCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("expire-estimate-matches error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
