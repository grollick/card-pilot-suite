import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { user_id, handle, meta } = body;

    if (!user_id || !handle) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or handle" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse device info from user agent
    const ua = (meta?.user_agent || "").toLowerCase();
    let device_type = "Desktop";
    let os = "Unknown";
    let browser = "Unknown";

    if (/iphone/i.test(ua)) { device_type = "Mobile"; os = "iOS"; }
    else if (/ipad/i.test(ua)) { device_type = "Tablet"; os = "iOS"; }
    else if (/android/i.test(ua)) {
      device_type = /mobile/i.test(ua) ? "Mobile" : "Tablet";
      os = "Android";
    } else if (/macintosh/i.test(ua)) { os = "macOS"; }
    else if (/windows/i.test(ua)) { os = "Windows"; }
    else if (/linux/i.test(ua)) { os = "Linux"; }

    if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = "Chrome";
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
    else if (/firefox/i.test(ua)) browser = "Firefox";
    else if (/edg/i.test(ua)) browser = "Edge";

    // IP-based geolocation (best-effort)
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    let city = "Unknown";
    let region = "Unknown";
    let country = "Unknown";

    if (ip && ip !== "unknown" && ip !== "127.0.0.1") {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country`, {
          signal: AbortSignal.timeout(2000),
        });
        if (geoRes.ok) {
          const geo = await geoRes.json();
          city = geo.city || "Unknown";
          region = geo.regionName || "Unknown";
          country = geo.country || "Unknown";
        }
      } catch {
        // Geo lookup failed — continue without it
      }
    }

    const enrichedMeta = {
      ...meta,
      device_type,
      os,
      browser,
      city,
      region,
      country,
      ip_hash: ip !== "unknown" ? await hashIP(ip) : null,
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if this visitor has been seen before (returning visitor detection)
    let isReturning = false;
    let previousVisitCount = 0;
    if (enrichedMeta.ip_hash) {
      const { count } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user_id)
        .eq("event_type", "card_view")
        .containedBy("meta_json", {})  // can't filter by jsonb field easily, so we query all and filter
      
      // Query previous views with same ip_hash using textSearch workaround
      const { data: prevViews } = await supabase
        .from("analytics_events")
        .select("id")
        .eq("user_id", user_id)
        .eq("event_type", "card_view");

      previousVisitCount = (prevViews ?? []).length;
      // We'll check after insert if there were previous ones with same hash
    }

    // Insert the analytics event
    const { error: insertError } = await supabase
      .from("analytics_events")
      .insert({
        user_id,
        handle,
        event_type: "card_view",
        meta_json: enrichedMeta,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    // Check returning status after insert by looking for matching ip_hash
    if (enrichedMeta.ip_hash) {
      const { data: matchingViews } = await supabase
        .from("analytics_events")
        .select("id")
        .eq("user_id", user_id)
        .eq("event_type", "card_view")
        .filter("meta_json->>ip_hash", "eq", enrichedMeta.ip_hash);
      
      isReturning = (matchingViews?.length ?? 0) > 1;
    }

    // Send email notification to card owner (fire-and-forget)
    sendViewNotification(supabase, user_id, enrichedMeta, isReturning).catch(e =>
      console.error("Notification error:", e)
    );

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("track-card-view error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "cardpilot-salt");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

async function sendViewNotification(
  supabase: any,
  cardOwnerId: string,
  meta: Record<string, any>
) {
  // Get owner profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, name")
    .eq("id", cardOwnerId)
    .single();

  if (!profile?.email) return;

  // Rate-limit: don't send more than 1 email per 15 minutes per owner
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", cardOwnerId)
    .eq("event_type", "card_view")
    .gte("created_at", fifteenMinAgo);

  // Only send if this is the first view in 15 min window
  if ((count ?? 0) > 1) return;

  const location = [meta.city, meta.region, meta.country]
    .filter(v => v && v !== "Unknown")
    .join(", ") || "Unknown location";

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "CardPilot <onboarding@resend.dev>",
      to: [profile.email],
      subject: "👀 Someone just viewed your card",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#ffffff;">
          <h2 style="color:#4361ee;margin:0 0 16px;">Someone viewed your card</h2>
          <p style="color:#374151;margin:0 0 20px;">Hey ${profile.name || "there"}, someone just visited your digital card.</p>
          <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden;">
            <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;">Device</td><td style="padding:12px 16px;color:#111827;font-weight:600;font-size:13px;">${meta.device_type} · ${meta.os}</td></tr>
            <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;">Browser</td><td style="padding:12px 16px;color:#111827;font-weight:600;font-size:13px;">${meta.browser}</td></tr>
            <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;">Location</td><td style="padding:12px 16px;color:#111827;font-weight:600;font-size:13px;">${location}</td></tr>
            <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;">Time</td><td style="padding:12px 16px;color:#111827;font-weight:600;font-size:13px;">${new Date().toLocaleString("en-US", { timeZone: "UTC" })} UTC</td></tr>
            ${meta.referrer ? `<tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;">Source</td><td style="padding:12px 16px;color:#111827;font-weight:600;font-size:13px;">${meta.referrer}</td></tr>` : ""}
          </table>
          <a href="https://cardpilot.com/app/viewers" style="display:inline-block;padding:12px 24px;background:#4361ee;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin-top:20px;">View All Visitors</a>
          <p style="color:#9ca3af;font-size:11px;margin:24px 0 0;">CardPilot — Your digital business card platform</p>
        </div>
      `,
    }),
  });
}
