import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find users in "monitoring" status approaching or past deadline
    const { data: guarantees, error: gErr } = await supabase
      .from("first_lead_guarantee")
      .select("id, user_id, deadline_at, status, activated_at")
      .eq("status", "monitoring")
      .lte("deadline_at", new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()); // within 4 hours of deadline

    if (gErr) throw gErr;
    if (!guarantees?.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const guarantee of guarantees) {
      // Check if user already has any leads
      const { count: leadCount } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", guarantee.user_id);

      if ((leadCount ?? 0) > 0) {
        // User already got a lead — mark as matched
        await supabase
          .from("first_lead_guarantee")
          .update({
            status: "matched",
            first_lead_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", guarantee.id);
        processed++;
        continue;
      }

      // Try to find a real nearby request to match
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, city, profession_id, handle")
        .eq("id", guarantee.user_id)
        .single();

      if (!profile) continue;

      // Check for unmatched estimate requests in user's city/profession
      let matchedRequestId: string | null = null;

      if (profile.city || profile.profession_id) {
        const query = supabase
          .from("estimate_requests")
          .select("id")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1);

        if (profile.city) query.eq("city", profile.city);

        const { data: requests } = await query;

        if (requests?.length) {
          matchedRequestId = requests[0].id;

          // Create a match for this user with high priority
          await supabase.from("estimate_matches").insert({
            estimate_request_id: matchedRequestId,
            user_id: guarantee.user_id,
            match_score: 90,
            priority_rank: 1,
            status: "pending",
          });

          await supabase
            .from("first_lead_guarantee")
            .update({
              status: "matched",
              matched_request_id: matchedRequestId,
              first_lead_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", guarantee.id);

          processed++;
          continue;
        }
      }

      // No real request available — create a test lead
      const testLeadName = "[Demo] Sample Customer";
      const testLeadEmail = `demo+${guarantee.user_id.slice(0, 8)}@cardpilot.test`;

      // Use the capture_lead RPC to create properly
      const { data: captureResult } = await supabase.rpc("capture_lead", {
        p_owner_id: guarantee.user_id,
        p_name: testLeadName,
        p_email: testLeadEmail,
        p_phone: null,
        p_source: "first_lead_guarantee",
        p_activity_type: "test_lead",
        p_activity_title: "First Lead Guarantee — Test opportunity delivered",
        p_activity_description:
          "This is a demo lead to help you explore the platform. Try responding to practice your workflow!",
        p_meta_json: { is_test: true, guarantee_id: guarantee.id },
        p_handle: profile.handle,
      });

      const testLeadId = (captureResult as any)?.lead_id ?? null;

      await supabase
        .from("first_lead_guarantee")
        .update({
          status: "test_delivered",
          test_lead_id: testLeadId,
          first_lead_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", guarantee.id);

      // Log to autopilot
      await supabase.from("autopilot_log").insert({
        user_id: guarantee.user_id,
        action_type: "first_lead_guarantee",
        title: "First Lead Guarantee activated",
        description: "Delivered a test lead to help user explore the platform workflow.",
        status: "completed",
        meta_json: { guarantee_id: guarantee.id, test_lead_id: testLeadId },
      });

      processed++;
    }

    return new Response(JSON.stringify({ processed, total: guarantees.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("first-lead-guarantee error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
