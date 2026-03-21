import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESPONSE_WINDOW_MINUTES = 60;
const MAX_MATCHES = 3;

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

  // Auth guard: only allow calls with service role key or anon key
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  if (token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") && token !== Deno.env.get("SUPABASE_ANON_KEY")) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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

    // 3. Find on-duty users first, then recently active as fallback
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: dutyUsers } = await supabase
      .from("estimate_duty_status")
      .select("user_id, service_types, service_radius_km, max_leads, leads_received, avg_response_minutes, duty_type, is_on_duty, updated_at, accepted_leads_count, completed_estimates_count, missed_leads_count")
      .or(`is_on_duty.eq.true,updated_at.gte.${twoHoursAgo}`);

    const eligibleDuty = (dutyUsers ?? []).filter((d: any) => {
      if (d.max_leads && d.leads_received >= d.max_leads) return false;
      return true;
    });

    const dutyUserIds = eligibleDuty.map((d: any) => d.user_id);
    if (dutyUserIds.length === 0) {
      // Fallback: find marketplace-enabled profiles
      const { data: fallbackProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("marketplace_enabled", true)
        .eq("available_for_work", true)
        .limit(10);

      if (!fallbackProfiles?.length) {
        await supabase
          .from("estimate_requests")
          .update({ status: "no_matches" })
          .eq("id", estimateRequestId);
        return new Response(JSON.stringify({ matched: 0, reason: "no_available_users" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use fallback IDs with empty duty records
      for (const p of fallbackProfiles) {
        if (!dutyUserIds.includes(p.id)) {
          dutyUserIds.push(p.id);
          eligibleDuty.push({
            user_id: p.id, is_on_duty: false, service_types: null,
            max_leads: null, leads_received: 0, avg_response_minutes: null,
            duty_type: "fallback", accepted_leads_count: 0,
            completed_estimates_count: 0, missed_leads_count: 0, updated_at: null,
          });
        }
      }
    }

    // 4. Get profiles for candidates
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, handle, email, city, plan, avg_response_minutes, professions(name)")
      .in("id", dutyUserIds);

    // 5. Get duty services for service matching
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

    // 6. Get historical performance (response rate, win rate)
    const { data: matchHistory } = await supabase
      .from("estimate_matches")
      .select("user_id, status")
      .in("user_id", dutyUserIds)
      .in("status", ["responded", "expired", "won", "lost", "pending"]);

    const perfMap = new Map<string, { total: number; responded: number; won: number }>();
    (matchHistory ?? []).forEach((m: any) => {
      const perf = perfMap.get(m.user_id) ?? { total: 0, responded: 0, won: 0 };
      perf.total++;
      if (m.status === "responded" || m.status === "won") perf.responded++;
      if (m.status === "won") perf.won++;
      perfMap.set(m.user_id, perf);
    });

    // 7. Score candidates
    const dutyMap = new Map(eligibleDuty.map((d: any) => [d.user_id, d]));
    const scored = (profiles ?? []).map((p: any) => {
      let score = 0;
      const duty = dutyMap.get(p.id);

      // On-duty boost (primary signal)
      if (duty?.is_on_duty) score += 60;
      else if (duty?.updated_at) score += 25; // Recently active

      // Service match
      if (estReq.service_needed) {
        const svcNames = userServices.get(p.id) ?? duty?.service_types ?? [];
        const profName = p.professions?.name ?? "";
        const needed = estReq.service_needed.toLowerCase();
        const svcMatch = svcNames.some((s: string) =>
          needed.includes(s.toLowerCase()) || s.toLowerCase().includes(needed)
        );
        const profMatch = profName && (
          needed.includes(profName.toLowerCase()) || profName.toLowerCase().includes(needed)
        );
        if (svcMatch) score += 30;
        else if (profMatch) score += 20;
      }

      // Profession match (from estimate_request.profession field)
      if (estReq.profession && p.professions?.name) {
        const reqProf = estReq.profession.toLowerCase();
        const userProf = p.professions.name.toLowerCase();
        if (reqProf.includes(userProf) || userProf.includes(reqProf)) {
          score += 25;
        }
      }

      // Location match
      if ((estReq.city || estReq.location) && p.city) {
        const loc = (estReq.city || estReq.location || "").toLowerCase();
        if (p.city.toLowerCase().includes(loc) || loc.includes(p.city.toLowerCase())) {
          score += 25;
        }
      }

      // Response speed bonus
      const avgResp = duty?.avg_response_minutes ?? p.avg_response_minutes;
      if (avgResp && avgResp < 15) score += 25;
      else if (avgResp && avgResp < 30) score += 20;
      else if (avgResp && avgResp < 60) score += 10;

      // Historical performance optimization (response rate * win rate)
      const perf = perfMap.get(p.id);
      if (perf && perf.total >= 3) {
        const responseRate = perf.responded / perf.total;
        const winRate = perf.total > 0 ? perf.won / perf.total : 0;
        // Up to 20 points for response rate, 15 for win rate
        score += Math.round(responseRate * 20);
        score += Math.round(winRate * 15);
      }

      // Plan tier
      if (p.plan === "pro_plus" || p.plan === "agency") score += 15;
      else if (p.plan === "pro" || p.plan === "growth") score += 5;

      return { ...p, score, duty, perf: perf ?? null };
    });

    scored.sort((a: any, b: any) => b.score - a.score);
    const topMatches = scored.slice(0, MAX_MATCHES).filter((m: any) => m.score > 0);

    // 8. Create matches, leads, and send notifications
    const deadline = new Date(Date.now() + RESPONSE_WINDOW_MINUTES * 60000).toISOString();

    for (let i = 0; i < topMatches.length; i++) {
      const match = topMatches[i];

      // Create CRM lead via capture_lead
      const { data: leadResult } = await supabase.rpc("capture_lead", {
        p_owner_id: match.id,
        p_name: estReq.requester_name,
        p_email: estReq.requester_email || null,
        p_phone: estReq.requester_phone || null,
        p_source: "marketplace",
        p_activity_type: "estimate_request_routed",
        p_activity_title: `Auto-matched: ${estReq.requester_name} — ${estReq.service_needed || "General"}`,
        p_activity_description: [
          `Quality: ${qualityScore}/100 | Match Score: ${match.score}`,
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
          match_score: match.score,
          match_rank: i + 1,
          auto_matched: true,
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
        was_on_duty: !!duty?.is_on_duty,
      });

      // Increment leads_received counter
      if (match.duty) {
        await supabase
          .from("estimate_duty_status")
          .update({
            leads_received: (match.duty.leads_received ?? 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", match.id);
      }

      // Send email notification
      if (match.email) {
        try {
          const firstName = estReq.requester_name.split(" ")[0];
          await supabase.functions.invoke("send-email", {
            body: {
              to: match.email,
              subject: `⚡ New lead matched: ${firstName} needs ${estReq.service_needed || "your help"}`,
              html: `
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
                  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px;border-radius:12px 12px 0 0;text-align:center">
                    <h1 style="color:white;margin:0;font-size:20px">🎯 New Auto-Matched Lead</h1>
                    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">You've been matched because ${match.duty?.is_on_duty ? "you're on duty" : "you were recently active"}</p>
                  </div>
                  <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none">
                    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:16px">
                      <p style="margin:0 0 8px;font-weight:600;font-size:16px">${estReq.requester_name}</p>
                      ${estReq.service_needed ? `<p style="margin:0 0 6px"><strong>Service:</strong> ${estReq.service_needed}</p>` : ""}
                      ${estReq.requester_email ? `<p style="margin:0 0 6px"><strong>Email:</strong> ${estReq.requester_email}</p>` : ""}
                      ${estReq.requester_phone ? `<p style="margin:0 0 6px"><strong>Phone:</strong> ${estReq.requester_phone}</p>` : ""}
                      ${estReq.budget ? `<p style="margin:0 0 6px"><strong>Budget:</strong> ${estReq.budget}</p>` : ""}
                      ${estReq.timeline ? `<p style="margin:0 0 6px"><strong>Timeline:</strong> ${estReq.timeline}</p>` : ""}
                      ${estReq.request_details ? `<p style="margin:0"><strong>Details:</strong> ${estReq.request_details}</p>` : ""}
                    </div>
                    <div style="background:#fef3c7;border-radius:8px;padding:12px;margin-bottom:16px;text-align:center">
                      <p style="margin:0;color:#92400e;font-weight:600;font-size:14px">⏱ Respond within ${RESPONSE_WINDOW_MINUTES} minutes to win this lead</p>
                    </div>
                    <div style="text-align:center">
                      <a href="https://guzzl.pro/app/contacts" style="background:#6366f1;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px">View Lead & Respond</a>
                    </div>
                    ${estReq.requester_phone ? `
                    <div style="text-align:center;margin-top:12px">
                      <a href="tel:${estReq.requester_phone}" style="background:#22c55e;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-size:14px">📞 Call Now</a>
                    </div>
                    ` : ""}
                  </div>
                  <div style="background:#f8fafc;padding:16px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;text-align:center">
                    <p style="margin:0;color:#6b7280;font-size:12px">Match quality: ${match.score} pts | Lead quality: ${qualityScore}/100</p>
                  </div>
                </div>
              `,
            },
          });
        } catch (e) {
          console.error("Email failed for", match.id, e);
        }
      }
    }

    // 9. Update request status
    await supabase
      .from("estimate_requests")
      .update({ status: topMatches.length > 0 ? "routed" : "no_matches" })
      .eq("id", estimateRequestId);

    return new Response(
      JSON.stringify({
        matched: topMatches.length,
        estimateRequestId,
        qualityScore,
        matchScores: topMatches.map((m: any) => ({ userId: m.id, score: m.score })),
      }),
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
