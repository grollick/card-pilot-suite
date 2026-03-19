import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESPONSE_WINDOW_MINUTES = 60;

function calculateLeadQuality(req: any): number {
  let score = 0;
  if (req.requester_name) score += 5;
  if (req.requester_email) score += 8;
  if (req.requester_phone) score += 7;
  if (req.service_needed) score += 5;
  if (req.request_details) score += 5;

  const budgetMap: Record<string, number> = {
    "Under $100": 5, "$100–$500": 10, "$500–$1,000": 18,
    "$1,000–$5,000": 25, "$5,000+": 30, "Not sure": 8,
  };
  score += budgetMap[req.budget] ?? 0;

  const timelineMap: Record<string, number> = {
    ASAP: 25, "This week": 20, "This month": 12, Flexible: 5,
  };
  score += timelineMap[req.timeline] ?? 0;

  if (req.location || req.city) score += 10;
  if (req.profession) score += 5;
  return Math.min(score, 100);
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { estimateRequestId } = await req.json();
    if (!estimateRequestId)
      return new Response(JSON.stringify({ error: "Missing estimateRequestId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch estimate request
    const { data: estReq, error: eErr } = await supabase
      .from("estimate_requests")
      .select("*")
      .eq("id", estimateRequestId)
      .single();
    if (eErr || !estReq) {
      return new Response(JSON.stringify({ error: "Estimate request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Score the request
    const qualityScore = calculateLeadQuality(estReq);
    await supabase
      .from("estimate_requests")
      .update({ lead_quality_score: qualityScore, status: "routing" })
      .eq("id", estimateRequestId);

    // 3. Find on-duty users
    const { data: onDutyUsers } = await supabase
      .from("estimate_duty_status")
      .select("user_id, service_types, service_radius_km, max_leads, leads_received, avg_response_minutes, duty_type")
      .eq("is_on_duty", true);

    const eligibleDuty = (onDutyUsers ?? []).filter((d: any) => {
      if (d.max_leads && d.leads_received >= d.max_leads) return false;
      return true;
    });

    // 4. Get profiles for on-duty users
    const dutyUserIds = eligibleDuty.map((d: any) => d.user_id);
    if (dutyUserIds.length === 0) {
      await supabase
        .from("estimate_requests")
        .update({ status: "no_matches" })
        .eq("id", estimateRequestId);
      return new Response(JSON.stringify({ matched: 0, reason: "no_on_duty_users" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, handle, email, city, plan, avg_response_minutes")
      .in("id", dutyUserIds);

    // 5. Also check duty_services for service matching
    const { data: dutyServicesData } = await supabase
      .from("estimate_duty_services")
      .select("user_id, booking_services(name)")
      .in("user_id", dutyUserIds);

    const userServices = new Map<string, string[]>();
    (dutyServicesData ?? []).forEach((ds: any) => {
      const existing = userServices.get(ds.user_id) ?? [];
      if (ds.booking_services?.name) existing.push(ds.booking_services.name);
      userServices.set(ds.user_id, existing);
    });

    // 6. Score candidates
    const dutyMap = new Map(eligibleDuty.map((d: any) => [d.user_id, d]));
    const scored = (profiles ?? []).map((p: any) => {
      let score = 60; // Base on-duty boost
      const duty = dutyMap.get(p.id);

      // Service match
      if (estReq.service_needed) {
        const svcNames = userServices.get(p.id) ?? duty?.service_types ?? [];
        const svcMatch = svcNames.some((s: string) =>
          estReq.service_needed.toLowerCase().includes(s.toLowerCase()) ||
          s.toLowerCase().includes(estReq.service_needed.toLowerCase())
        );
        if (svcMatch) score += 30;
      }

      // Location match
      if ((estReq.city || estReq.location) && p.city) {
        const loc = (estReq.city || estReq.location || "").toLowerCase();
        if (p.city.toLowerCase().includes(loc) || loc.includes(p.city.toLowerCase())) {
          score += 25;
        }
      }

      // Fast responder
      const avgResp = duty?.avg_response_minutes ?? p.avg_response_minutes;
      if (avgResp && avgResp < 30) score += 20;
      else if (avgResp && avgResp < 60) score += 10;

      // Premium boost
      if (p.plan === "pro_plus" || p.plan === "agency") score += 15;
      else if (p.plan === "pro" || p.plan === "growth") score += 5;

      return { ...p, score, duty };
    });

    scored.sort((a: any, b: any) => b.score - a.score);
    const topMatches = scored.slice(0, 3).filter((m: any) => m.score > 0);

    // 7. Create matches and leads
    const deadline = new Date(Date.now() + RESPONSE_WINDOW_MINUTES * 60000).toISOString();

    for (let i = 0; i < topMatches.length; i++) {
      const match = topMatches[i];

      // Create CRM lead
      const { data: leadResult } = await supabase.rpc("capture_lead", {
        p_owner_id: match.id,
        p_name: estReq.requester_name,
        p_email: estReq.requester_email || null,
        p_phone: estReq.requester_phone || null,
        p_source: "marketplace",
        p_activity_type: "estimate_request_routed",
        p_activity_title: `Estimate request: ${estReq.requester_name} — ${estReq.service_needed || "General"}`,
        p_activity_description: [
          `Quality: ${qualityScore}/100`,
          estReq.budget ? `Budget: ${estReq.budget}` : null,
          estReq.timeline ? `Timeline: ${estReq.timeline}` : null,
          estReq.request_details ? `Details: ${estReq.request_details}` : null,
        ].filter(Boolean).join(" | "),
        p_meta_json: {
          estimate_request_id: estimateRequestId,
          service_needed: estReq.service_needed,
          budget: estReq.budget,
          timeline: estReq.timeline,
          quality_score: qualityScore,
          match_rank: i + 1,
        },
        p_handle: match.handle || null,
      });

      const leadId = leadResult?.lead_id ?? null;

      // Create match record
      await supabase.from("estimate_matches").insert({
        estimate_request_id: estimateRequestId,
        user_id: match.id,
        match_score: match.score,
        priority_rank: i + 1,
        was_notified: true,
        notified_at: new Date().toISOString(),
        response_deadline_at: deadline,
        status: "pending",
        lead_id: leadId,
      });

      // Log duty event
      await supabase.from("estimate_duty_log").insert({
        user_id: match.id,
        lead_id: leadId,
        event_type: "lead_received",
        was_on_duty: true,
      });

      // Increment leads_received
      await supabase
        .from("estimate_duty_status")
        .update({
          leads_received: (match.duty?.leads_received ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", match.id);

      // Send email notification
      if (match.email) {
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: match.email,
              subject: `⚡ New estimate request from ${estReq.requester_name}`,
              html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                  <h2>New Estimate Request</h2>
                  <p>You've been matched with a new estimate lead because you're On Duty.</p>
                  <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin:16px 0">
                    <p><strong>Name:</strong> ${estReq.requester_name}</p>
                    ${estReq.requester_email ? `<p><strong>Email:</strong> ${estReq.requester_email}</p>` : ""}
                    ${estReq.service_needed ? `<p><strong>Service:</strong> ${estReq.service_needed}</p>` : ""}
                    ${estReq.budget ? `<p><strong>Budget:</strong> ${estReq.budget}</p>` : ""}
                    ${estReq.timeline ? `<p><strong>Timeline:</strong> ${estReq.timeline}</p>` : ""}
                  </div>
                  <p style="color:#e11d48;font-weight:600">⏱ Respond within ${RESPONSE_WINDOW_MINUTES} minutes to keep this lead!</p>
                  <p><a href="https://card-pilot-suite.lovable.app/app/contacts" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">View in Dashboard</a></p>
                </div>
              `,
            },
          });
        } catch (e) {
          console.error("Email failed for", match.id, e);
        }
      }
    }

    // Update request status
    await supabase
      .from("estimate_requests")
      .update({ status: topMatches.length > 0 ? "routed" : "no_matches" })
      .eq("id", estimateRequestId);

    return new Response(
      JSON.stringify({ matched: topMatches.length, estimateRequestId, qualityScore }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-estimate-matches error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
