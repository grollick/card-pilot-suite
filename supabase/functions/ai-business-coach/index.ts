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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];

    // Gather comprehensive business context in parallel
    const [
      { count: leadsWeek },
      { count: leadsMonth },
      { count: bookingsWeek },
      { count: bookingsMonth },
      { data: recentEvents },
      { data: idleLeads },
      { data: profile },
      { data: recentEstimates },
      { data: pendingTasks },
      { data: recentReviews },
      { data: weekMetrics },
      { count: totalLeads },
      { data: cardData },
    ] = await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sevenDaysAgo),
      supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", thirtyDaysAgo),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sevenDaysAgo),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", thirtyDaysAgo),
      supabase.from("analytics_events").select("event_type, meta_json, created_at").eq("user_id", user.id).gte("created_at", sevenDaysAgo).limit(200),
      supabase.from("leads").select("id, name, last_activity_at").eq("user_id", user.id).eq("status", "open").lt("last_activity_at", sevenDaysAgo).limit(10),
      supabase.from("profiles").select("name, company, profession, created_at").eq("id", user.id).single(),
      supabase.from("estimates").select("id, status, total, created_at").eq("user_id", user.id).gte("created_at", thirtyDaysAgo).limit(20),
      supabase.from("tasks").select("id, title, due_date, status").eq("user_id", user.id).eq("status", "open").limit(10),
      supabase.from("reviews").select("id, rating, created_at").eq("user_id", user.id).gte("created_at", thirtyDaysAgo).limit(20),
      supabase.from("daily_metrics").select("*").eq("user_id", user.id).gte("metric_date", sevenDaysAgo).order("metric_date", { ascending: false }),
      supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("cards").select("id, status").eq("user_id", user.id).eq("status", "published").limit(1),
    ]);

    const events = recentEvents ?? [];
    const views = events.filter(e => e.event_type === "card_view").length;
    const clicks = events.filter(e => e.event_type === "button_click").length;
    const estimates = recentEstimates ?? [];
    const approvedEstimates = estimates.filter(e => e.status === "approved").length;
    const pendingEstimatesCount = estimates.filter(e => e.status === "sent" || e.status === "pending").length;
    const reviews = recentReviews ?? [];
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : "N/A";
    const hasPublishedCard = (cardData ?? []).length > 0;
    const daysSinceSignup = Math.floor((now.getTime() - new Date(profile?.created_at ?? now).getTime()) / 86400000);

    // Weekly revenue from daily_metrics
    const weeklyRevenue = (weekMetrics ?? []).reduce((s, m) => s + (m.revenue || 0), 0);
    const weeklyViews = (weekMetrics ?? []).reduce((s, m) => s + (m.card_views || 0), 0);

    // Peak engagement hour
    const clickHours: Record<number, number> = {};
    events.filter(e => e.event_type === "button_click").forEach(e => {
      const h = new Date(e.created_at).getHours();
      clickHours[h] = (clickHours[h] || 0) + 1;
    });
    const peakHour = Object.entries(clickHours).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

    const conversionRate = views > 0 ? Math.round(((leadsWeek ?? 0) / views) * 100) : 0;

    const contextStr = `
Day: ${dayOfWeek}
Business: ${profile?.company || profile?.name || "Unknown"}
Profession: ${profile?.profession || "Not specified"}
Days on platform: ${daysSinceSignup}
Card published: ${hasPublishedCard}

WEEKLY STATS:
- Card views: ${views} (total this week: ${weeklyViews})
- CTA clicks: ${clicks}
- New leads: ${leadsWeek ?? 0}
- Bookings: ${bookingsWeek ?? 0}
- Revenue: $${weeklyRevenue.toFixed(0)}
- Conversion rate: ${conversionRate}%

MONTHLY STATS:
- Leads: ${leadsMonth ?? 0}
- Bookings: ${bookingsMonth ?? 0}
- Total leads all-time: ${totalLeads ?? 0}
- Estimates sent: ${estimates.length} (approved: ${approvedEstimates}, pending: ${pendingEstimatesCount})
- Reviews: ${reviews.length} (avg rating: ${avgRating})

WARNINGS:
- Idle leads (no activity 7+ days): ${(idleLeads ?? []).length}
${(idleLeads ?? []).slice(0, 3).map(l => `  - ${l.name}`).join("\n")}
- Open tasks: ${(pendingTasks ?? []).length}
${(pendingTasks ?? []).slice(0, 3).map(t => `  - ${t.title} (due: ${t.due_date || "no date"})`).join("\n")}
${peakHour ? `- Peak engagement: ${peakHour[0]}:00 (${peakHour[1]} interactions)` : ""}
`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback rule-based coaching
      return new Response(JSON.stringify({
        daily_plan: [
          { task: "Check and respond to new leads", priority: "high", route: "/app/contacts" },
          { task: "Follow up with idle contacts", priority: "medium", route: "/app/contacts" },
          { task: "Share your card to get more visibility", priority: "low", route: "/app/card" },
        ],
        insights: [
          { title: `${views} views this week`, description: "Keep sharing your card to maintain visibility.", type: "info" },
        ],
        tips: ["Respond to leads within 5 minutes for 10x higher conversion."],
        opportunities: [],
        performance: { views, leads: leadsWeek ?? 0, bookings: bookingsWeek ?? 0, revenue: weeklyRevenue, conversion_rate: conversionRate },
        warnings: (idleLeads ?? []).length > 0
          ? [{ title: `${(idleLeads ?? []).length} idle leads`, description: "Follow up before they go cold.", type: "warning" }]
          : [],
        weekly_summary: null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // AI-powered comprehensive coaching
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        tools: [{
          type: "function",
          function: {
            name: "return_coaching",
            description: "Return comprehensive business coaching data.",
            parameters: {
              type: "object",
              properties: {
                daily_plan: {
                  type: "array",
                  description: "2-3 specific tasks for today based on current data",
                  items: {
                    type: "object",
                    properties: {
                      task: { type: "string", description: "Specific action to take (max 10 words)" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      reason: { type: "string", description: "Why this matters (1 sentence)" },
                    },
                    required: ["task", "priority", "reason"],
                    additionalProperties: false,
                  },
                },
                insights: {
                  type: "array",
                  description: "2-3 data-driven insights about the business",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Short headline (max 8 words)" },
                      description: { type: "string", description: "Actionable insight (1-2 sentences)" },
                      type: { type: "string", enum: ["tip", "warning", "info", "opportunity"] },
                    },
                    required: ["title", "description", "type"],
                    additionalProperties: false,
                  },
                },
                tips: {
                  type: "array",
                  description: "2-3 short growth tips relevant to their profession and data",
                  items: { type: "string" },
                },
                opportunities: {
                  type: "array",
                  description: "1-2 growth opportunities based on current data patterns",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      potential_impact: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["title", "description", "potential_impact"],
                    additionalProperties: false,
                  },
                },
                warnings: {
                  type: "array",
                  description: "Missed opportunities or urgent issues. Only include if relevant.",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      type: { type: "string", enum: ["missed_lead", "low_activity", "review_needed", "estimate_pending"] },
                    },
                    required: ["title", "description", "type"],
                    additionalProperties: false,
                  },
                },
                weekly_summary: {
                  type: "object",
                  description: "Brief weekly performance summary",
                  properties: {
                    headline: { type: "string", description: "One-line summary of the week (max 12 words)" },
                    wins: { type: "array", items: { type: "string" }, description: "1-2 positive highlights" },
                    focus_areas: { type: "array", items: { type: "string" }, description: "1-2 areas to improve" },
                  },
                  required: ["headline", "wins", "focus_areas"],
                  additionalProperties: false,
                },
              },
              required: ["daily_plan", "insights", "tips", "opportunities", "warnings", "weekly_summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_coaching" } },
        messages: [
          {
            role: "system",
            content: `You are an expert business growth coach for small service businesses. Today is ${dayOfWeek}. Analyze the data and provide comprehensive, actionable coaching. Be specific — reference actual numbers and patterns. Tailor advice to their profession and current situation. Keep all text concise and action-oriented. If it's a weekend, focus on planning and preparation tasks. If early in the week, focus on outreach and lead generation.`,
          },
          { role: "user", content: contextStr },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({
          daily_plan: [{ task: "Review your leads", priority: "high", reason: "Stay on top of opportunities" }],
          insights: [{ title: "Coach temporarily unavailable", description: "Please try again shortly.", type: "info" }],
          tips: ["Respond to leads quickly for better conversion."],
          opportunities: [],
          performance: { views, leads: leadsWeek ?? 0, bookings: bookingsWeek ?? 0, revenue: weeklyRevenue, conversion_rate: conversionRate },
          warnings: [],
          weekly_summary: null,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let coaching: any = {};
    if (toolCall?.function?.arguments) {
      try {
        coaching = JSON.parse(toolCall.function.arguments);
      } catch {
        coaching = {};
      }
    }

    // Merge with real performance stats
    coaching.performance = {
      views,
      leads: leadsWeek ?? 0,
      bookings: bookingsWeek ?? 0,
      revenue: weeklyRevenue,
      conversion_rate: conversionRate,
      avg_rating: avgRating,
      total_leads: totalLeads ?? 0,
      estimates_pending: pendingEstimatesCount,
    };

    return new Response(JSON.stringify(coaching), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-business-coach error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
