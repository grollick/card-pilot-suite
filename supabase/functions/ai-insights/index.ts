import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather business stats for context
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: leadsWeek },
      { count: leadsMonth },
      { count: bookingsWeek },
      { count: bookingsMonth },
      { data: recentEvents },
      { data: idleLeads },
      { data: profile },
    ] = await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sevenDaysAgo),
      supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", thirtyDaysAgo),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", sevenDaysAgo),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", thirtyDaysAgo),
      supabase.from("analytics_events").select("event_type, meta_json, created_at").eq("user_id", user.id).gte("created_at", sevenDaysAgo).limit(200),
      supabase.from("leads").select("id, name, last_activity_at").eq("user_id", user.id).eq("status", "open").lt("last_activity_at", sevenDaysAgo).limit(10),
      supabase.from("profiles").select("name, company").eq("id", user.id).single(),
    ]);

    const events = recentEvents ?? [];
    const views = events.filter(e => e.event_type === "card_view").length;
    const clicks = events.filter(e => e.event_type === "button_click").length;

    // Analyze click times for peak hour
    const clickHours: Record<number, number> = {};
    events.filter(e => e.event_type === "button_click").forEach(e => {
      const h = new Date(e.created_at).getHours();
      clickHours[h] = (clickHours[h] || 0) + 1;
    });
    const peakHour = Object.entries(clickHours).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

    // Analyze top CTA
    const ctaCounts: Record<string, number> = {};
    events.filter(e => e.event_type === "button_click").forEach(e => {
      const meta = e.meta_json as any;
      const cta = meta?.cta || "unknown";
      ctaCounts[cta] = (ctaCounts[cta] || 0) + 1;
    });
    const topCta = Object.entries(ctaCounts).sort((a, b) => b[1] - a[1])[0];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback: generate rule-based insights
      const insights = [];
      if ((idleLeads ?? []).length > 0) {
        insights.push({ title: `${(idleLeads ?? []).length} leads need follow-up`, description: "These contacts haven't had activity in over 7 days. Reach out to keep them engaged.", type: "warning" });
      }
      if (peakHour) {
        insights.push({ title: `Peak engagement at ${Number(peakHour[0]) > 12 ? Number(peakHour[0]) - 12 : peakHour[0]}${Number(peakHour[0]) >= 12 ? "pm" : "am"}`, description: "Most visitors interact with your card during this hour. Schedule posts and promotions around this time.", type: "tip" });
      }
      if (topCta) {
        insights.push({ title: `Most popular action: ${topCta[0]}`, description: `"${topCta[0]}" is your most clicked button with ${topCta[1]} clicks this week.`, type: "info" });
      }
      if (views > 0 && (leadsWeek ?? 0) === 0) {
        insights.push({ title: "Views but no leads", description: `You had ${views} card views this week but no new leads. Consider making your contact form more prominent.`, type: "warning" });
      }
      return new Response(JSON.stringify({ insights }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI-powered insights
    const contextStr = `Business: ${profile?.company || profile?.name || "Unknown"}
Stats (last 7 days): ${views} card views, ${clicks} CTA clicks, ${leadsWeek ?? 0} new leads, ${bookingsWeek ?? 0} bookings
Stats (last 30 days): ${leadsMonth ?? 0} leads, ${bookingsMonth ?? 0} bookings
Idle leads (no activity 7+ days): ${(idleLeads ?? []).length}
${peakHour ? `Peak engagement hour: ${peakHour[0]}:00 (${peakHour[1]} interactions)` : ""}
${topCta ? `Most clicked CTA: ${topCta[0]} (${topCta[1]} clicks)` : ""}
Conversion rate: ${views > 0 ? Math.round(((leadsWeek ?? 0) / views) * 100) : 0}%`;

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
            name: "return_insights",
            description: "Return 3-5 actionable business insights based on the data.",
            parameters: {
              type: "object",
              properties: {
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Short insight headline (max 8 words)" },
                      description: { type: "string", description: "Actionable advice in 1-2 sentences" },
                      type: { type: "string", enum: ["tip", "warning", "info"] },
                    },
                    required: ["title", "description", "type"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["insights"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_insights" } },
        messages: [
          { role: "system", content: "You are a business growth advisor. Analyze the data and provide 3-5 specific, actionable insights to help this small business grow. Focus on concrete actions they can take today. Be direct and specific — reference actual numbers." },
          { role: "user", content: contextStr },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ insights: [{ title: "AI insights temporarily unavailable", description: "Please try again in a moment.", type: "info" }] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const responseText = await response.text();
    let aiData;
    try {
      aiData = JSON.parse(responseText);
    } catch {
      console.error("ai-insights: failed to parse AI response:", responseText.slice(0, 500));
      return new Response(JSON.stringify({ insights: [{ title: "AI insights temporarily unavailable", description: "Please try again in a moment.", type: "info" }] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let insights = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        insights = parsed.insights ?? [];
      } catch {
        insights = [{ title: "Insight generation failed", description: "Please try refreshing.", type: "info" }];
      }
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-insights error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
