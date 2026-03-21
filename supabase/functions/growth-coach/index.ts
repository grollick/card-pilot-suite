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
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, mode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check AI usage limits
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("name, company, bio, city, phone, email, plan, handle, profession")
      .eq("id", user.id)
      .single();

    const planKey = profileData?.plan || "starter";
    const aiLimits: Record<string, number> = { starter: 5, free: 5, growth: 50, pro: 500, agency: -1 };
    const limit = aiLimits[planKey] ?? 5;

    const { data: usageCheck, error: usageError } = await adminClient.rpc(
      "check_and_increment_ai_usage",
      { p_user_id: user.id, p_limit: limit }
    );

    if (usageError || !usageCheck?.allowed) {
      return new Response(
        JSON.stringify({
          error: `AI limit reached (${usageCheck?.current ?? 0}/${limit} this month). Upgrade for more.`,
          code: "AI_LIMIT_REACHED",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══════════════════════════════════════════
    // Gather deep performance data
    // ═══════════════════════════════════════════
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString();

    const [
      leadsWeekRes,
      leadsMonthRes,
      bookingsWeekRes,
      bookingsMonthRes,
      eventsRes,
      idleLeadsRes,
      servicesRes,
      estimatesRes,
      reviewsRes,
      activitiesRes,
      metricsRes,
      cardRes,
      automationRes,
    ] = await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true })
        .eq("user_id", user.id).gte("created_at", sevenDaysAgo),
      supabase.from("leads").select("*", { count: "exact", head: true })
        .eq("user_id", user.id).gte("created_at", thirtyDaysAgo),
      supabase.from("bookings").select("*", { count: "exact", head: true })
        .eq("user_id", user.id).gte("created_at", sevenDaysAgo),
      supabase.from("bookings").select("*", { count: "exact", head: true })
        .eq("user_id", user.id).gte("created_at", thirtyDaysAgo),
      supabase.from("analytics_events").select("event_type, meta_json, created_at")
        .eq("user_id", user.id).gte("created_at", sevenDaysAgo).limit(300),
      supabase.from("leads").select("id, name, email, last_activity_at, created_at")
        .eq("user_id", user.id).eq("status", "open")
        .or(`last_activity_at.lt.${sevenDaysAgo},last_activity_at.is.null`)
        .limit(15),
      supabase.from("booking_services").select("name, price, duration_min, description")
        .eq("user_id", user.id).eq("active", true),
      supabase.from("estimates").select("id, status, grand_total, created_at")
        .eq("user_id", user.id).gte("created_at", thirtyDaysAgo),
      supabase.from("reviews").select("id, rating, is_public")
        .eq("user_id", user.id),
      supabase.from("contact_activities").select("title, activity_type, occurred_at, lead_id")
        .eq("user_id", user.id).order("occurred_at", { ascending: false }).limit(20),
      supabase.from("daily_metrics").select("metric_date, leads_count, bookings_count, card_views, revenue")
        .eq("user_id", user.id).gte("metric_date", sixtyDaysAgo).order("metric_date", { ascending: false }),
      supabase.from("cards").select("sections_json, status, updated_at")
        .eq("user_id", user.id).limit(1).single(),
      supabase.from("automation_rules").select("id, trigger_type, action_type, enabled")
        .eq("user_id", user.id),
    ]);

    const events = eventsRes.data ?? [];
    const views = events.filter((e) => e.event_type === "card_view").length;
    const clicks = events.filter((e) => e.event_type === "button_click").length;
    const formSubmits = events.filter((e) => e.event_type === "form_submit").length;

    // Response time calculation
    const recentActivities = activitiesRes.data ?? [];
    const responseActivities = recentActivities.filter(
      (a) => ["email_sent", "call", "note", "followup_sent"].includes(a.activity_type)
    );

    // Estimate conversion
    const estimates = estimatesRes.data ?? [];
    const sentEstimates = estimates.filter((e) => e.status === "sent" || e.status === "approved");
    const approvedEstimates = estimates.filter((e) => e.status === "approved");
    const estimateConversionRate = sentEstimates.length > 0
      ? Math.round((approvedEstimates.length / sentEstimates.length) * 100) : 0;

    // Reviews
    const reviews = reviewsRes.data ?? [];
    const avgRating = reviews.length > 0
      ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1) : "N/A";

    // Weekly metrics trend
    const metrics = metricsRes.data ?? [];
    const thisWeekMetrics = metrics.filter(
      (m) => new Date(m.metric_date) >= new Date(sevenDaysAgo)
    );
    const weekRevenue = thisWeekMetrics.reduce((s, m) => s + Number(m.revenue ?? 0), 0);

    // Card analysis
    const cardSections = cardRes.data?.sections_json;
    const sectionCount = Array.isArray(cardSections) ? cardSections.length : 0;
    const cardStatus = cardRes.data?.status ?? "draft";

    // Services
    const services = servicesRes.data ?? [];
    const hasBookingEnabled = services.length > 0;

    // Automations
    const automations = automationRes.data ?? [];
    const activeAutomations = automations.filter((a) => a.enabled).length;

    // ═══════════════════════════════════════════
    // Build rich context
    // ═══════════════════════════════════════════
    const contextParts: string[] = [
      `Business: ${profileData?.company || profileData?.name || "Unknown"}`,
      `City: ${profileData?.city || "Not set"}`,
      `Profession: ${profileData?.profession || "Not set"}`,
      `Plan: ${planKey}`,
      "",
      "── PERFORMANCE (Last 7 days) ──",
      `Card views: ${views} | CTA clicks: ${clicks} | Form submissions: ${formSubmits}`,
      `New leads: ${leadsWeekRes.count ?? 0} | Bookings: ${bookingsWeekRes.count ?? 0}`,
      `Revenue this week: $${weekRevenue.toLocaleString()}`,
      `Conversion rate (views → leads): ${views > 0 ? Math.round(((leadsWeekRes.count ?? 0) / views) * 100) : 0}%`,
      "",
      "── PERFORMANCE (Last 30 days) ──",
      `Leads: ${leadsMonthRes.count ?? 0} | Bookings: ${bookingsMonthRes.count ?? 0}`,
      `Estimates sent: ${sentEstimates.length} | Approved: ${approvedEstimates.length} (${estimateConversionRate}% rate)`,
      "",
      "── PROFILE & CARD ──",
      `Card status: ${cardStatus} | Sections: ${sectionCount}`,
      `Bio: ${profileData?.bio ? "Set" : "Not set"}`,
      `Services: ${hasBookingEnabled ? services.map((s) => `${s.name} ($${s.price ?? 0})`).join(", ") : "None configured"}`,
      `Reviews: ${reviews.length} (avg ${avgRating}) | Public: ${reviews.filter((r) => r.is_public).length}`,
      "",
      "── AUTOMATION ──",
      `Active automations: ${activeAutomations} of ${automations.length} rules`,
      `Idle leads (no activity 7+ days): ${(idleLeadsRes.data ?? []).length}`,
      "",
      "── RECENT ACTIVITY ──",
      recentActivities.slice(0, 8).map((a) => `• ${a.title}`).join("\n") || "No recent activity",
    ];

    // ═══════════════════════════════════════════
    // System prompt based on mode
    // ═══════════════════════════════════════════
    const systemPrompt = `You are guzzl.pro Growth Coach — an AI business advisor that helps service professionals generate more leads, close more jobs, and grow revenue.

YOUR ROLE:
- Analyze the user's actual business data and identify specific growth opportunities
- Provide actionable, data-driven recommendations they can implement TODAY
- Generate marketing content, follow-up messages, and service descriptions on demand
- Create weekly performance summaries with clear next steps
- Act as a proactive business coach, not just a chatbot

USER'S BUSINESS DATA:
${contextParts.join("\n")}

COACHING GUIDELINES:
1. ALWAYS reference their actual numbers — never give generic advice
2. Prioritize high-impact, low-effort actions first
3. When suggesting improvements, explain the expected outcome (e.g., "This could increase your conversion rate by 15-20%")
4. Format responses with clear headers, bullet points, and action items
5. If they ask for content (descriptions, messages, promotions), generate it immediately — ready to copy/paste
6. For performance summaries, use a structured format: Wins → Opportunities → Action Plan
7. Be encouraging but honest about areas needing improvement
8. Suggest specific guzzl.pro features they should use (booking, automations, reviews, etc.)

CONTENT GENERATION RULES:
- Service descriptions: Professional, benefit-focused, 2-3 sentences
- Follow-up messages: Warm, personal, include a clear CTA
- Promotions: Urgency-driven, value-focused, profession-appropriate
- Social posts: Engaging, include hashtags, profession-relevant

Use markdown formatting. Be concise but thorough.`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    console.error("growth-coach error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
