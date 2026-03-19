import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Score a lead 0–100 based on completeness, budget, timeline, location & service match */
function calculateLeadQualityScore(quoteReq: any): number {
  let score = 0;

  // Completeness (max 30): each filled field adds points
  if (quoteReq.customer_name) score += 5;
  if (quoteReq.customer_email) score += 8;
  if (quoteReq.customer_phone) score += 7;
  if (quoteReq.service_needed) score += 5;
  if (quoteReq.notes) score += 5;

  // Budget signal (max 30)
  const budgetMap: Record<string, number> = {
    "Under $100": 5,
    "$100–$500": 10,
    "$500–$1,000": 18,
    "$1,000–$5,000": 25,
    "$5,000+": 30,
    "Not sure": 8,
  };
  score += budgetMap[quoteReq.budget] ?? 0;

  // Timeline urgency (max 25)
  const timelineMap: Record<string, number> = {
    "ASAP": 25,
    "This week": 20,
    "This month": 12,
    "Flexible": 5,
  };
  score += timelineMap[quoteReq.timeline] ?? 0;

  // Location provided (max 10)
  if (quoteReq.location) score += 10;

  // Profession/service specificity (max 5)
  if (quoteReq.profession) score += 5;

  return Math.min(score, 100);
}

function getQualityTier(score: number): string {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteRequestId } = await req.json();

    if (!quoteRequestId) {
      return new Response(JSON.stringify({ error: "Missing quoteRequestId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch the quote request
    const { data: quoteReq, error: qErr } = await supabase
      .from("marketplace_quote_requests")
      .select("*")
      .eq("id", quoteRequestId)
      .single();

    if (qErr || !quoteReq) {
      return new Response(JSON.stringify({ error: "Quote request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Calculate lead quality score
    const leadQualityScore = calculateLeadQualityScore(quoteReq);
    const qualityTier = getQualityTier(leadQualityScore);

    // Persist score on the quote request
    await supabase
      .from("marketplace_quote_requests")
      .update({ lead_quality_score: leadQualityScore })
      .eq("id", quoteRequestId);

    // 3. Find matching businesses — priority routing for high-quality leads
    // First check for on-duty users
    const { data: onDutyUsers } = await supabase
      .from("estimate_duty_status")
      .select("user_id, service_types, service_radius_km, max_leads, leads_received")
      .eq("is_on_duty", true);

    const onDutySet = new Map<string, any>();
    (onDutyUsers ?? []).forEach((d: any) => {
      // Skip users who hit their lead cap
      if (d.max_leads && d.leads_received >= d.max_leads) return;
      onDutySet.set(d.user_id, d);
    });

    let query = supabase
      .from("profiles")
      .select("id, name, handle, email, city, available_for_work, avg_response_minutes, plan, professions(name)")
      .not("handle", "is", null)
      .not("name", "is", null)
      .eq("marketplace_enabled", true);

    // High-quality leads: prefer premium users & fast responders
    if (qualityTier === "high") {
      query = query.order("plan", { ascending: false }).order("avg_response_minutes", { ascending: true, nullsFirst: false });
    } else {
      query = query.order("avg_response_minutes", { ascending: true, nullsFirst: false });
    }

    const { data: candidates, error: cErr } = await query;
    if (cErr) throw cErr;

    // Score and filter candidates
    const scored = (candidates ?? []).map((c: any) => {
      let score = 0;

      // ON DUTY PRIORITY BOOST
      const dutyInfo = onDutySet.get(c.id);
      if (dutyInfo) {
        score += 60; // Major boost for on-duty users

        // Service type match for on-duty
        if (dutyInfo.service_types?.length > 0 && quoteReq.service_needed) {
          const svcMatch = dutyInfo.service_types.some((st: string) =>
            quoteReq.service_needed.toLowerCase().includes(st.toLowerCase())
          );
          if (svcMatch) score += 20;
        }
      }

      // Profession match
      if (quoteReq.profession && c.professions?.name) {
        const profMatch = c.professions.name.toLowerCase().includes(
          quoteReq.profession.toLowerCase().replace(/-/g, " ")
        );
        if (profMatch) score += 50;
      }

      // Location match
      if (quoteReq.location && c.city) {
        const locMatch = c.city.toLowerCase().includes(
          quoteReq.location.toLowerCase().replace(/-/g, " ")
        );
        if (locMatch) score += 30;
      }

      // Availability boost
      if (c.available_for_work) score += 20;

      // Fast responder boost
      if (c.avg_response_minutes && c.avg_response_minutes < 60) score += 15;

      // Premium plan boost for high-quality leads
      if (qualityTier === "high") {
        if (c.plan === "growth" || c.plan === "pro") score += 25;
        if (c.avg_response_minutes && c.avg_response_minutes < 30) score += 10;
      }

      return { ...c, score, isOnDuty: !!dutyInfo };
    });

    scored.sort((a: any, b: any) => b.score - a.score);
    const topMatches = scored.slice(0, 3).filter((m: any) => m.score > 0);
    const finalMatches = topMatches.length > 0
      ? topMatches
      : scored.filter((c: any) => c.available_for_work).slice(0, 3);

    // 4. Create leads and routing logs for each match
    let matched = 0;

    const qualityLabel = qualityTier === "high" ? "⭐ High-quality lead" : qualityTier === "medium" ? "✅ Good lead" : "📋 New lead";
    const urgencyNote = qualityTier === "high"
      ? "This is a high-value lead — respond within 30 minutes for best results!"
      : "Respond quickly — leads who hear back within 1 hour are 7x more likely to convert.";

    for (const business of finalMatches) {
      const { data: leadResult } = await supabase.rpc("capture_lead", {
        p_owner_id: business.id,
        p_name: quoteReq.customer_name,
        p_email: quoteReq.customer_email || null,
        p_phone: quoteReq.customer_phone || null,
        p_source: "marketplace",
        p_activity_type: "quote_requested",
        p_activity_title: `${qualityLabel}: ${quoteReq.customer_name} — ${quoteReq.service_needed || "General inquiry"}`,
        p_activity_description: [
          `Quality Score: ${leadQualityScore}/100 (${qualityTier})`,
          quoteReq.budget ? `Budget: ${quoteReq.budget}` : null,
          quoteReq.timeline ? `Timeline: ${quoteReq.timeline}` : null,
          quoteReq.notes ? `Notes: ${quoteReq.notes}` : null,
        ].filter(Boolean).join(" | "),
        p_meta_json: {
          quote_request_id: quoteRequestId,
          service_needed: quoteReq.service_needed,
          budget: quoteReq.budget,
          timeline: quoteReq.timeline,
          lead_quality_score: leadQualityScore,
          quality_tier: qualityTier,
          source_type: "marketplace_routing",
        },
        p_handle: business.handle || null,
      });

      const leadId = leadResult?.lead_id || null;

      // Update lead_score on the lead record
      if (leadId) {
        await supabase
          .from("leads")
          .update({ lead_score: leadQualityScore })
          .eq("id", leadId);
      }

      // Insert routing log with quality score
      await supabase.from("lead_routing_log").insert({
        quote_request_id: quoteRequestId,
        user_id: business.id,
        lead_id: leadId,
        status: "delivered",
        delivered_at: new Date().toISOString(),
        lead_quality_score: leadQualityScore,
      });

      // Send email with quality context
      if (business.email) {
        const qualityBadgeColor = qualityTier === "high" ? "#16a34a" : qualityTier === "medium" ? "#ca8a04" : "#6b7280";
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: business.email,
              subject: `${qualityLabel} ${quoteReq.customer_name} needs ${quoteReq.service_needed || "your services"}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #1a1a1a;">New Lead from CardPilot Marketplace</h2>
                  <div style="display: inline-block; background: ${qualityBadgeColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600; margin-bottom: 12px;">
                    Quality Score: ${leadQualityScore}/100 — ${qualityTier.toUpperCase()}
                  </div>
                  <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 16px 0;">
                    <p><strong>Name:</strong> ${quoteReq.customer_name}</p>
                    ${quoteReq.customer_email ? `<p><strong>Email:</strong> ${quoteReq.customer_email}</p>` : ""}
                    ${quoteReq.customer_phone ? `<p><strong>Phone:</strong> ${quoteReq.customer_phone}</p>` : ""}
                    ${quoteReq.service_needed ? `<p><strong>Service:</strong> ${quoteReq.service_needed}</p>` : ""}
                    ${quoteReq.budget ? `<p><strong>Budget:</strong> ${quoteReq.budget}</p>` : ""}
                    ${quoteReq.timeline ? `<p><strong>Timeline:</strong> ${quoteReq.timeline}</p>` : ""}
                    ${quoteReq.notes ? `<p><strong>Details:</strong> ${quoteReq.notes}</p>` : ""}
                  </div>
                  <p style="color: #666;">${urgencyNote}</p>
                  <p><a href="https://card-pilot-suite.lovable.app/app/contacts" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View in Dashboard</a></p>
                </div>
              `,
            },
          });
        } catch (emailErr) {
          console.error("Email notification failed for", business.id, emailErr);
        }
      }

      // Dashboard notification with quality context
      if (leadId) {
        await supabase.from("contact_activities").insert({
          user_id: business.id,
          lead_id: leadId,
          activity_type: "notification",
          title: `${qualityLabel}: ${quoteReq.customer_name}`,
          description: `Score: ${leadQualityScore}/100 | Service: ${quoteReq.service_needed || "General"} | Budget: ${quoteReq.budget || "Not specified"} | ${urgencyNote}`,
          occurred_at: new Date().toISOString(),
        });
      }

      matched++;
    }

    return new Response(JSON.stringify({ matched, quoteRequestId, leadQualityScore, qualityTier }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("route-marketplace-lead error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
