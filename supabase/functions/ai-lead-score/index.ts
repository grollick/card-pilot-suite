import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lead_ids } = await req.json();
    if (!lead_ids?.length) {
      return new Response(JSON.stringify({ scores: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch leads with activities
    const { data: leads } = await supabase
      .from("leads")
      .select("id, name, email, phone, source, status, created_at, last_activity_at, lead_score, custom_fields_json, company")
      .eq("user_id", user.id)
      .in("id", lead_ids.slice(0, 20));

    if (!leads?.length) {
      return new Response(JSON.stringify({ scores: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch activities for these leads
    const { data: activities } = await supabase
      .from("contact_activities")
      .select("lead_id, activity_type, title")
      .in("lead_id", leads.map(l => l.id))
      .order("occurred_at", { ascending: false })
      .limit(100);

    const activityMap = new Map<string, any[]>();
    for (const a of activities ?? []) {
      if (!activityMap.has(a.lead_id)) activityMap.set(a.lead_id, []);
      activityMap.get(a.lead_id)!.push(a);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback: heuristic scoring
      const scores = leads.map(l => {
        let score = 50;
        if (l.email) score += 10;
        if (l.phone) score += 10;
        if (l.source === "booking") score += 15;
        if (l.source === "card_form") score += 10;
        if (l.source === "referral") score += 20;
        const acts = activityMap.get(l.id) ?? [];
        if (acts.length > 3) score += 10;
        if (!l.last_activity_at) score -= 15;
        return {
          lead_id: l.id,
          score: Math.max(0, Math.min(100, score)),
          tier: score >= 70 ? "hot" : score >= 40 ? "warm" : "cold",
          reason: score >= 70 ? "High engagement signals" : score >= 40 ? "Moderate interest" : "Needs nurturing",
        };
      });
      return new Response(JSON.stringify({ scores }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI-powered scoring
    const leadsContext = leads.map(l => {
      const acts = activityMap.get(l.id) ?? [];
      return `Lead: ${l.name} | Email: ${l.email || "none"} | Phone: ${l.phone || "none"} | Source: ${l.source} | Status: ${l.status} | Created: ${l.created_at} | Last activity: ${l.last_activity_at || "never"} | Activities: ${acts.length} (${acts.slice(0, 5).map(a => a.activity_type).join(", ")})`;
    }).join("\n");

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
            name: "score_leads",
            description: "Score each lead as hot, warm, or cold with a reason",
            parameters: {
              type: "object",
              properties: {
                scores: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      lead_name: { type: "string" },
                      score: { type: "number", description: "0-100 score" },
                      tier: { type: "string", enum: ["hot", "warm", "cold"] },
                      reason: { type: "string", description: "One sentence explanation" },
                      suggested_action: { type: "string", description: "Specific next action like 'Send estimate' or 'Call back'" },
                    },
                    required: ["lead_name", "score", "tier", "reason", "suggested_action"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["scores"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "score_leads" } },
        messages: [
          { role: "system", content: "You are a lead scoring AI for a local service business CRM. Score each lead based on their engagement signals, contact completeness, source quality, and recency. Hot leads (70-100) are ready to buy, warm leads (40-69) need nurturing, cold leads (0-39) need re-engagement." },
          { role: "user", content: leadsContext },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let aiScores: any[] = [];
    if (toolCall?.function?.arguments) {
      try {
        aiScores = JSON.parse(toolCall.function.arguments).scores ?? [];
      } catch { /* fallback below */ }
    }

    // Match AI scores back to lead IDs
    const scores = leads.map((l, i) => {
      const aiScore = aiScores[i] || aiScores.find((s: any) => s.lead_name?.toLowerCase() === l.name?.toLowerCase());
      return {
        lead_id: l.id,
        score: aiScore?.score ?? 50,
        tier: aiScore?.tier ?? "warm",
        reason: aiScore?.reason ?? "AI analysis pending",
        suggested_action: aiScore?.suggested_action ?? "Follow up",
      };
    });

    return new Response(JSON.stringify({ scores }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-lead-score error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
