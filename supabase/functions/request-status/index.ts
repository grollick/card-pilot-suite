import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string" || token.length < 16 || token.length > 128) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS - we validate via token match
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find request by exact token match
    const { data: request, error: reqErr } = await supabase
      .from("estimate_requests")
      .select("id, requester_name, service_needed, request_details, location, budget, timeline, status, created_at")
      .eq("tracking_token", token)
      .maybeSingle();

    if (reqErr) {
      console.error("DB error:", reqErr);
      return new Response(
        JSON.stringify({ error: "Server error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!request) {
      return new Response(
        JSON.stringify({ error: "Not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch responses for this request
    const { data: responses } = await supabase
      .from("job_request_responses")
      .select("id, user_id, message, price_estimate, availability, status, created_at, estimate_request_id")
      .eq("estimate_request_id", request.id)
      .order("created_at", { ascending: true });

    // Fetch public profile info for responders
    const userIds = (responses || []).map((r: any) => r.user_id);
    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, name, company, handle, avatar_url, city")
        .in("id", userIds);
      profiles = profileData || [];
    }

    const enrichedResponses = (responses || []).map((r: any) => ({
      ...r,
      profile: profiles.find((p: any) => p.id === r.user_id) || null,
    }));

    return new Response(
      JSON.stringify({ request, responses: enrichedResponses }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("request-status error:", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
