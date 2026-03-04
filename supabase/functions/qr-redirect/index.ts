import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Look up campaign
  const { data: campaign, error } = await supabase
    .from("qr_campaigns")
    .select("id, user_id, active")
    .eq("code", code)
    .single();

  if (error || !campaign) {
    return new Response("Campaign not found", { status: 404, headers: corsHeaders });
  }

  if (!campaign.active) {
    return new Response("Campaign is inactive", { status: 410, headers: corsHeaders });
  }

  // Get user's handle
  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", campaign.user_id)
    .single();

  const handle = profile?.handle;
  if (!handle) {
    return new Response("User has no public card", { status: 404, headers: corsHeaders });
  }

  // Parse device info
  const userAgent = req.headers.get("user-agent") || "";
  let device = "Desktop";
  if (/mobile|android|iphone/i.test(userAgent)) device = "Mobile";
  else if (/ipad|tablet/i.test(userAgent)) device = "Tablet";

  const referrer = req.headers.get("referer") || "";

  // Log the scan
  await supabase.from("qr_scans").insert({
    campaign_id: campaign.id,
    user_id: campaign.user_id,
    handle,
    device,
    referrer: referrer || null,
    user_agent: userAgent.slice(0, 500),
    meta_json: {
      timestamp: new Date().toISOString(),
      utm_source: "qr",
      utm_campaign: code,
    },
  });

  // Log analytics event
  await supabase.from("analytics_events").insert({
    user_id: campaign.user_id,
    handle,
    event_type: "card_view",
    meta_json: {
      source: "qr_campaign",
      campaign_code: code,
      device,
      referrer: referrer || null,
    },
  });

  // Redirect to public card with UTM params
  const redirectUrl = `/${handle}?utm_source=qr&utm_campaign=${encodeURIComponent(code)}`;

  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      Location: redirectUrl,
    },
  });
});
