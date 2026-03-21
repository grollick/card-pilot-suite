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

    // Fetch card + profile + analytics
    const [{ data: card }, { data: profile }, { count: views }, { count: leads }] = await Promise.all([
      supabase.from("cards").select("sections_json, theme_json, status").eq("user_id", user.id).limit(1).single(),
      supabase.from("profiles").select("name, company, profession, avatar_url, bio").eq("id", user.id).single(),
      supabase.from("analytics_events").select("*", { count: "exact", head: true })
        .eq("user_id", user.id).eq("event_type", "card_view"),
      supabase.from("leads").select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    if (!card) {
      return new Response(JSON.stringify({ suggestions: [{ title: "Create your card first", description: "You need a published card to get AI optimization suggestions.", priority: "high", section: "general", action_label: "Create Card", action_route: "/app/card" }] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sections = Array.isArray(card.sections_json) ? card.sections_json : [];
    const sectionTypes = sections.map((s: any) => `${s.id || s.type}: ${s.enabled ? "enabled" : "disabled"}`).join(", ");
    const conversionRate = (views ?? 0) > 0 ? Math.round(((leads ?? 0) / (views ?? 1)) * 100) : 0;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const context = `Business: ${profile?.company || profile?.name || "Unknown"}
Profession: ${profile?.profession || "unknown"}
Has avatar: ${!!profile?.avatar_url}
Has bio: ${!!profile?.bio}
Bio length: ${(profile?.bio || "").length} chars
Card status: ${card.status}
Sections: ${sectionTypes}
Total card views: ${views ?? 0}
Total leads: ${leads ?? 0}
Conversion rate: ${conversionRate}%`;

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
            name: "optimize_card",
            description: "Return 3-5 specific card optimization suggestions",
            parameters: {
              type: "object",
              properties: {
                overall_score: { type: "number", description: "Overall card quality score 0-100" },
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Short improvement title" },
                      description: { type: "string", description: "Specific actionable advice" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      section: { type: "string", description: "Which card section this relates to" },
                      impact: { type: "string", description: "Expected impact like '+15% conversion'" },
                    },
                    required: ["title", "description", "priority", "section", "impact"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["overall_score", "suggestions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "optimize_card" } },
        messages: [
          { role: "system", content: "You are a conversion rate optimization expert for digital business cards. Analyze the card data and provide specific, actionable suggestions to improve lead conversion. Focus on missing sections, weak content, and proven best practices for the user's profession. Be specific — reference actual data." },
          { role: "user", content: context },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ suggestions: [], overall_score: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result = { suggestions: [], overall_score: 50 };
    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch { /* fallback */ }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-card-optimizer error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
