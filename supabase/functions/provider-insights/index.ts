import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: any;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, context } = body;
    const NON_AI_ACTIONS = [
      "update_suggestion", "get_suggestions", "get_usage", "get_roi",
      "get_lead_scores", "get_lead_score", "log_reply", "get_reply_stats",
      "get_auto_reply_settings", "save_auto_reply_settings", "get_dashboard_summary",
    ];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY && !NON_AI_ACTIONS.includes(action)) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get provider's business
    const { data: business } = await supabase
      .from("businesses")
      .select("id, business_name, description, location_city, location_region, slug, logo_url, phone, email, website, cover_image_url")
      .eq("owner_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const businessId = business?.id;
    const businessName = business?.business_name || "your business";

    const ok = (result: any) => new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    const err = (msg: string, status = 400) => new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // ─── SUGGESTION STATUS UPDATE ───
    if (action === "update_suggestion") {
      const { suggestionId, status } = context || {};
      if (!suggestionId || !["active", "used", "dismissed"].includes(status)) return err("Invalid suggestion update");
      const { error } = await supabase
        .from("ai_assistant_suggestions")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", suggestionId)
        .eq("user_id", user.id);
      if (error) throw error;
      return ok({ success: true });
    }

    // ─── GET SAVED SUGGESTIONS ───
    if (action === "get_suggestions") {
      if (!businessId) return ok([]);
      const { data } = await supabase
        .from("ai_assistant_suggestions")
        .select("*")
        .eq("business_id", businessId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);
      return ok(data || []);
    }

    // ─── GET DASHBOARD SUMMARY ───
    if (action === "get_dashboard_summary") {
      if (!businessId) return ok(null);
      const { data } = await supabase
        .from("copilot_dashboard_summary")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle();
      return ok(data);
    }

    // ─── GET USAGE ───
    if (action === "get_usage") {
      if (!businessId) return ok({ used: 0, limit: 8, plan: "free", features: {} });
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [entRes, usageRes] = await Promise.all([
        supabase.from("business_ai_entitlements").select("*").eq("business_id", businessId).maybeSingle(),
        supabase.from("ai_usage_events").select("id", { count: "exact", head: true }).eq("business_id", businessId).gte("created_at", monthStart.toISOString()),
      ]);

      const ent = entRes.data;
      const used = usageRes.count || 0;
      return ok({
        used,
        limit: ent?.monthly_ai_generations ?? 8,
        plan: ent?.plan_name ?? "free",
        features: {
          follow_up: ent?.follow_up_enabled ?? false,
          profile_rewrite: ent?.profile_rewrite_enabled ?? false,
          advanced_growth: ent?.advanced_growth_enabled ?? false,
        },
      });
    }

    // ─── GET ROI METRICS ───
    if (action === "get_roi") {
      if (!businessId) return ok(null);

      const { data: roi } = await supabase.from("ai_roi_metrics").select("*").eq("business_id", businessId).maybeSingle();

      let avgJobValue = 150;
      const { data: services } = await supabase
        .from("services")
        .select("price_amount")
        .eq("business_id", businessId)
        .eq("is_active", true)
        .not("price_amount", "is", null);

      if (services && services.length > 0) {
        const total = services.reduce((sum: number, s: any) => sum + (s.price_amount || 0), 0);
        avgJobValue = Math.round(total / services.length) || 150;
      }

      const base = roi || {
        total_ai_generations: 0, total_ai_generations_month: 0,
        ai_assisted_leads: 0, ai_assisted_leads_month: 0,
        ai_assisted_bookings: 0, ai_assisted_bookings_month: 0,
        ai_assisted_leads_prev_month: 0, ai_assisted_bookings_prev_month: 0,
        conversion_rate: 0, conversion_rate_month: 0,
      };

      return ok({
        ...base,
        avg_job_value: avgJobValue,
        estimated_revenue: (base.ai_assisted_bookings || 0) * avgJobValue,
        estimated_revenue_month: (base.ai_assisted_bookings_month || 0) * avgJobValue,
      });
    }

    // ─── GET LEAD SCORES ───
    if (action === "get_lead_scores") {
      if (!businessId) return ok([]);
      const { data } = await supabase
        .from("ai_lead_scores")
        .select("*, business_leads(full_name, email, phone, message, status, source, created_at)")
        .eq("business_id", businessId)
        .order("score", { ascending: false })
        .limit(50);
      return ok(data || []);
    }

    // ─── GET SINGLE LEAD SCORE ───
    if (action === "get_lead_score") {
      const leadId = context?.leadId;
      if (!leadId || !businessId) return ok(null);
      const { data } = await supabase
        .from("ai_lead_scores")
        .select("*")
        .eq("lead_id", leadId)
        .eq("business_id", businessId)
        .maybeSingle();
      return ok(data);
    }

    // ─── LOG REPLY ───
    if (action === "log_reply") {
      if (!businessId) return err("No business found");
      const { leadId, bookingId, messageType, content, wasAutoSent, wasUserEdited } = context || {};
      const { error } = await supabase.from("ai_message_events").insert({
        business_id: businessId,
        lead_id: leadId || null,
        booking_id: bookingId || null,
        message_type: messageType || "initial_reply",
        generated_content: content || "",
        was_auto_sent: wasAutoSent || false,
        was_user_edited: wasUserEdited || false,
      });
      if (error) throw error;
      return ok({ success: true });
    }

    // ─── GET REPLY STATS ───
    if (action === "get_reply_stats") {
      if (!businessId) return ok({ total_replies: 0, sent_replies: 0, auto_sent_replies: 0, edited_replies: 0, leads_answered: 0, replies_30d: 0, replies_7d: 0 });
      const { data } = await supabase
        .from("copilot_reply_stats_v2")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle();
      return ok(data || { total_replies: 0, sent_replies: 0, auto_sent_replies: 0, edited_replies: 0, leads_answered: 0, replies_30d: 0, replies_7d: 0 });
    }

    // ─── GET AUTO-REPLY SETTINGS ───
    if (action === "get_auto_reply_settings") {
      if (!businessId) return ok(null);
      const { data } = await supabase
        .from("ai_automation_settings")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle();
      return ok(data);
    }

    // ─── SAVE AUTO-REPLY SETTINGS ───
    if (action === "save_auto_reply_settings") {
      if (!businessId) return err("No business found");
      const s = context?.settings || {};
      const { error } = await supabase.from("ai_automation_settings").upsert({
        business_id: businessId,
        auto_reply_enabled: s.auto_reply_enabled ?? false,
        auto_follow_up_enabled: s.auto_follow_up_enabled ?? false,
        review_before_send: s.review_before_send ?? true,
        reply_tone: s.reply_tone ?? "professional",
        business_hours_only: s.business_hours_only ?? true,
        high_intent_only: s.high_intent_only ?? false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "business_id" });
      if (error) throw error;
      return ok({ success: true });
    }

    // ─── ENFORCEMENT: check limits before AI calls ───
    const AI_ACTIONS = ["insights", "lead_reply", "follow_up", "booking_confirm", "review_request", "profile_optimize", "score_lead"];
    if (AI_ACTIONS.includes(action) && businessId) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [entRes, usageRes] = await Promise.all([
        supabase.from("business_ai_entitlements").select("*").eq("business_id", businessId).maybeSingle(),
        supabase.from("ai_usage_events").select("id", { count: "exact", head: true }).eq("business_id", businessId).gte("created_at", monthStart.toISOString()),
      ]);

      const ent = entRes.data;
      const used = usageRes.count || 0;
      const limit = ent?.monthly_ai_generations ?? 8;

      if (used >= limit) {
        return new Response(JSON.stringify({
          error: "ai_limit_reached", used, limit, plan: ent?.plan_name ?? "free",
        }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (action === "follow_up" && !(ent?.follow_up_enabled)) {
        return new Response(JSON.stringify({
          error: "feature_locked", feature: "follow_up", plan: ent?.plan_name ?? "free", required_plan: "pro",
        }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (action === "profile_optimize" && !(ent?.profile_rewrite_enabled)) {
        return new Response(JSON.stringify({
          error: "feature_locked", feature: "profile_rewrite", plan: ent?.plan_name ?? "free", required_plan: "pro",
        }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ─── FETCH REAL CONTEXT DATA ───
    let contextData: any = {};
    if (businessId) {
      const [leadsRes, bookingsRes, reviewsRes, profileRes, metricsRes, servicesRes] = await Promise.all([
        supabase.from("copilot_lead_context").select("*").eq("business_id", businessId).order("created_at", { ascending: false }).limit(30),
        supabase.from("copilot_booking_context").select("*").eq("business_id", businessId).order("booking_date", { ascending: false }).limit(20),
        supabase.from("business_reviews").select("id, rating, review_text, reviewer_name, created_at, is_approved").eq("business_id", businessId).order("created_at", { ascending: false }).limit(15),
        supabase.from("copilot_profile_context").select("*").eq("business_id", businessId).maybeSingle(),
        supabase.from("marketplace_metrics").select("*").eq("business_id", businessId).maybeSingle(),
        supabase.from("services").select("id, title, description, price_amount, price_type").eq("business_id", businessId).eq("is_active", true).limit(20),
      ]);

      contextData = {
        leads: leadsRes.data || [],
        bookings: bookingsRes.data || [],
        reviews: reviewsRes.data || [],
        profile: profileRes.data,
        metrics: metricsRes.data,
        services: servicesRes.data || [],
        business,
      };
    }

    const now = Date.now();
    const staleLeads = (contextData.leads || []).filter((l: any) => {
      if (l.status && l.status !== "new") return false;
      return now - new Date(l.created_at).getTime() > 24 * 60 * 60 * 1000;
    });
    const newLeads = (contextData.leads || []).filter((l: any) => !l.status || l.status === "new");
    const pendingBookings = (contextData.bookings || []).filter((b: any) => b.status === "pending");
    const completedBookings = (contextData.bookings || []).filter((b: any) => b.status === "completed");

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "insights": {
        const profileCtx = contextData.profile;
        const metrics = contextData.metrics;

        systemPrompt = `You are a practical business assistant for ${businessName}. Analyze the provider's current data and return a JSON array of actionable suggestions. Each suggestion must have: type (lead_reply|follow_up|review_request|profile_improve|booking_confirm), title (short, max 50 chars), description (1-2 sentences, practical), priority (high|medium|low), leadId or bookingId if applicable. Max 5 suggestions, sorted by priority. Only include relevant suggestions based on actual data.`;

        userPrompt = `Current real data:
- ${newLeads.length} new/unresponded leads${newLeads.length > 0 ? `: ${newLeads.slice(0, 3).map((l: any) => `${l.full_name} (${l.source || "unknown"}) - "${(l.message || "").slice(0, 80)}"`).join("; ")}` : ""}
- ${staleLeads.length} stale leads (>24h without response)${staleLeads.length > 0 ? `: ${staleLeads.slice(0, 3).map((l: any) => `${l.full_name} - ${Math.round((now - new Date(l.created_at).getTime()) / 3600000)}h ago`).join("; ")}` : ""}
- ${pendingBookings.length} pending bookings${pendingBookings.length > 0 ? `: ${pendingBookings.slice(0, 3).map((b: any) => `${b.customer_name} on ${b.booking_date}`).join("; ")}` : ""}
- ${completedBookings.length} completed bookings (may need review request)
- ${contextData.reviews?.length || 0} total reviews, avg rating: ${metrics?.avg_rating?.toFixed(1) || "N/A"}
- Marketplace score: ${metrics?.marketplace_score?.toFixed(1) || "N/A"}/100
- Profile: headline=${profileCtx?.headline ? "✓" : "✗"}, bio=${profileCtx?.bio ? "✓" : "✗"}, logo=${profileCtx?.logo_url ? "✓" : "✗"}, cover=${profileCtx?.cover_image_url ? "✓" : "✗"}, services=${profileCtx?.service_count || 0}, areas=${profileCtx?.service_area_count || 0}
- Booking enabled: ${profileCtx?.booking_enabled ? "yes" : "no"}, Lead form: ${profileCtx?.lead_form_enabled ? "yes" : "no"}

Generate actionable suggestions as a JSON array. Prioritize stale leads (follow_up) and new leads (lead_reply) as high priority.`;
        break;
      }

      case "lead_reply": {
        const lead = context?.lead;
        let leadData = lead;
        if (lead?.lead_id && businessId) {
          const { data: realLead } = await supabase.from("copilot_lead_context").select("*").eq("lead_id", lead.lead_id).eq("business_id", businessId).maybeSingle();
          if (realLead) leadData = realLead;
        }

        // Load reply tone from automation settings
        let replyTone = "professional";
        if (businessId) {
          const { data: settings } = await supabase.from("ai_automation_settings").select("reply_tone").eq("business_id", businessId).maybeSingle();
          if (settings?.reply_tone) replyTone = settings.reply_tone;
        }

        systemPrompt = `You are a helpful assistant for ${businessName}, a service provider. Generate a ${replyTone}, friendly reply to a customer lead inquiry. Keep it concise (3-5 sentences), warm, and action-oriented. Include a call to action (suggest booking or call). Return JSON: { reply: string, summary: string, missingInfo: string[], suggestedAction: string }`;
        userPrompt = `Lead details:
- Name: ${leadData?.full_name || "Unknown"}
- Message: "${leadData?.message || "No message provided"}"
- Email: ${leadData?.email || "Not provided"}
- Phone: ${leadData?.phone || "Not provided"}
- Source: ${leadData?.source || "marketplace"}
- Service requested: ${leadData?.service_title || "Not specified"}
- Received: ${leadData?.created_at || "recently"}
- Services we offer: ${contextData.services?.map((s: any) => s.title).join(", ") || "Various services"}`;
        break;
      }

      case "follow_up": {
        const lead = context?.lead;
        let leadData = lead;
        if (lead?.lead_id && businessId) {
          const { data: realLead } = await supabase.from("copilot_lead_context").select("*").eq("lead_id", lead.lead_id).eq("business_id", businessId).maybeSingle();
          if (realLead) leadData = realLead;
        }

        const ageHours = leadData?.created_at ? Math.round((now - new Date(leadData.created_at).getTime()) / 3600000) : null;

        systemPrompt = `You are a follow-up specialist for ${businessName}. Generate a friendly, non-pushy follow-up message for a lead that hasn't been contacted or booked yet. Keep it short (2-4 sentences). Return JSON: { message: string, subject: string }`;
        userPrompt = `Lead: ${leadData?.full_name || "Customer"}
Original message: "${leadData?.message || ""}"
Service: ${leadData?.service_title || "Not specified"}
Received: ${leadData?.created_at || "recently"}${ageHours ? ` (${ageHours} hours ago)` : ""}
Our services: ${contextData.services?.map((s: any) => s.title).join(", ") || "Various services"}`;
        break;
      }

      case "booking_confirm": {
        const booking = context?.booking;
        let bookingData = booking;
        if (booking?.booking_id && businessId) {
          const { data: realBooking } = await supabase.from("copilot_booking_context").select("*").eq("booking_id", booking.booking_id).eq("business_id", businessId).maybeSingle();
          if (realBooking) bookingData = realBooking;
        }

        systemPrompt = `You are a booking assistant for ${businessName}. Generate a professional booking confirmation and a day-before reminder message. Keep it warm and clear. Return JSON: { confirmation: string, reminder: string }`;
        userPrompt = `Booking: ${bookingData?.customer_name || "Customer"} on ${bookingData?.booking_date || "TBD"} at ${bookingData?.booking_time || "TBD"}. Service: ${bookingData?.service_title || "Not specified"}. Notes: ${bookingData?.notes || "None"}`;
        break;
      }

      case "review_request": {
        const booking = context?.booking;
        let bookingData = booking;
        if (booking?.booking_id && businessId) {
          const { data: realBooking } = await supabase.from("copilot_booking_context").select("*").eq("booking_id", booking.booking_id).eq("business_id", businessId).maybeSingle();
          if (realBooking) bookingData = realBooking;
        }

        systemPrompt = `You are a review request specialist for ${businessName}. Generate a short, friendly review request message. Keep it personal and easy to respond to. Return JSON: { message: string }`;
        userPrompt = `Customer: ${bookingData?.customer_name || "Customer"}, service: ${bookingData?.service_title || "service"}, date: ${bookingData?.booking_date || "recently"}.`;
        break;
      }

      case "profile_optimize": {
        const profileCtx = contextData.profile;
        const metrics = contextData.metrics;

        systemPrompt = `You are a marketplace optimization expert. Analyze this service provider's profile and give specific suggestions to improve conversion and marketplace ranking. Return JSON array of suggestions, each with: field (headline|description|services|logo|cover|phone|email|website|bio|service_areas), suggestion (string), reason (string), priority (high|medium|low). Max 5 suggestions. Focus on what's missing or weak.`;
        userPrompt = `Business: ${businessName}
Location: ${business?.location_city || "Unknown"}, ${business?.location_region || ""}
Description: ${business?.description || "MISSING"}
Logo: ${business?.logo_url ? "Yes" : "MISSING"}
Cover: ${business?.cover_image_url ? "Yes" : "MISSING"}
Phone: ${business?.phone || "MISSING"}
Email: ${business?.email || "MISSING"}
Website: ${business?.website || "MISSING"}
Headline: ${profileCtx?.headline || "MISSING"}
Bio: ${profileCtx?.bio || "MISSING"}
Booking enabled: ${profileCtx?.booking_enabled ? "Yes" : "No"}
Lead form enabled: ${profileCtx?.lead_form_enabled ? "Yes" : "No"}
Services count: ${profileCtx?.service_count || 0}
Service areas: ${profileCtx?.service_area_count || 0}
Reviews: ${metrics?.review_count || 0} (avg: ${metrics?.avg_rating?.toFixed(1) || "N/A"})
Marketplace score: ${metrics?.marketplace_score?.toFixed(1) || "N/A"}/100
Bookings last 30d: ${metrics?.booking_count_30d || 0}
Leads last 30d: ${metrics?.lead_count_30d || 0}`;
        break;
      }

      case "score_lead": {
        const lead = context?.lead;
        let leadData = lead;
        if (lead?.lead_id && businessId) {
          const { data: realLead } = await supabase.from("copilot_lead_context").select("*").eq("lead_id", lead.lead_id).eq("business_id", businessId).maybeSingle();
          if (realLead) leadData = realLead;
        }

        const ageHours = leadData?.created_at ? Math.round((now - new Date(leadData.created_at).getTime()) / 3600000) : null;

        systemPrompt = `You are a lead scoring expert for a local service business called ${businessName}. Score this lead from 1-100 on how likely it is to convert into a booking. Consider: completeness of info (name, email, phone), urgency language, service match clarity, recency, contact details provided, location match, and message detail. Return JSON: { score: number (1-100), label: "High Intent" | "Medium Intent" | "Low Intent", explanation: string (1-2 sentences, plain language, explain why), recommended_action: string (practical next step), factors: { completeness: number (0-100), urgency: number (0-100), service_match: number (0-100), recency: number (0-100), contact_quality: number (0-100) } }. Label mapping: 80-100=High Intent, 50-79=Medium Intent, below 50=Low Intent.`;
        userPrompt = `Lead details:
- Name: ${leadData?.full_name || "Not provided"}
- Email: ${leadData?.email || "Not provided"}
- Phone: ${leadData?.phone || "Not provided"}
- Message: "${leadData?.message || "No message"}"
- Service requested: ${leadData?.service_title || "Not specified"}
- Source: ${leadData?.source || "unknown"}
- Received: ${leadData?.created_at || "unknown"}${ageHours !== null ? ` (${ageHours}h ago)` : ""}
- Status: ${leadData?.status || "new"}
- Our services: ${contextData.services?.map((s: any) => s.title).join(", ") || "Various services"}
- Our location: ${business?.location_city || "Unknown"}`;
        break;
      }

      default:
        return err("Unknown action");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_result",
            description: "Return the structured result",
            parameters: {
              type: "object",
              properties: {
                result: { type: "object", description: "The structured result matching the requested format" },
              },
              required: ["result"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_result" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return err("Too many requests. Please wait a moment.", 429);
      if (response.status === 402) return err("AI credits exhausted.", 402);
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return err("AI service temporarily unavailable.", 500);
    }

    const aiData = await response.json();
    let result: any = null;
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        result = JSON.parse(toolCall.function.arguments).result;
      }
    } catch (e) {
      try {
        const content = aiData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        if (jsonMatch) result = JSON.parse(jsonMatch[0]);
      } catch {}
    }

    if (!result) {
      result = action === "insights" || action === "profile_optimize" ? [] : { error: "Could not generate suggestions" };
    }

    // Save insights suggestions
    if (action === "insights" && Array.isArray(result) && businessId) {
      const rows = result.map((s: any) => ({
        business_id: businessId, user_id: user.id,
        suggestion_type: s.type || "general", title: s.title || "Suggestion",
        description: s.description || "", priority: s.priority || "medium",
        status: "active", lead_id: s.leadId || null, booking_id: s.bookingId || null,
        ai_response: s,
      }));
      supabase.from("ai_assistant_suggestions").insert(rows).then(() => {});
    }

    // Save lead score to ai_lead_scores
    if (action === "score_lead" && result && !result.error && businessId && context?.lead?.lead_id) {
      const score = Math.max(1, Math.min(100, result.score || 0));
      const label = score >= 80 ? "High Intent" : score >= 50 ? "Medium Intent" : "Low Intent";
      supabase.from("ai_lead_scores").upsert({
        lead_id: context.lead.lead_id,
        business_id: businessId,
        score,
        label: result.label || label,
        explanation: result.explanation || "",
        recommended_action: result.recommended_action || "",
        scoring_factors: result.factors || {},
        updated_at: new Date().toISOString(),
      }, { onConflict: "lead_id" }).then(() => {});
    }

    // Save reply to ai_message_events
    if ((action === "lead_reply" || action === "follow_up") && result && !result.error && businessId && context?.lead?.lead_id) {
      supabase.from("ai_message_events").insert({
        business_id: businessId,
        lead_id: context.lead.lead_id,
        message_type: action === "follow_up" ? "follow_up" : "initial_reply",
        generated_content: result.reply || result.message || "",
        was_auto_sent: false,
        was_user_edited: false,
      }).then(() => {});
    }

    // Log usage event
    if (businessId && result && !result.error) {
      const entityType = ["lead_reply", "follow_up", "score_lead"].includes(action) ? "lead"
        : ["booking_confirm", "review_request"].includes(action) ? "booking"
        : action === "profile_optimize" ? "profile" : null;
      const entityId = context?.lead?.lead_id || context?.booking?.booking_id || null;

      supabase.from("ai_usage_events").insert({
        business_id: businessId, user_id: user.id,
        feature_key: action, entity_type: entityType, entity_id: entityId, credits_used: 1,
      }).then(() => {});
    }

    return ok(result);

  } catch (e) {
    console.error("provider-insights error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
