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

    const body = await req.json();
    const { action, post, posts } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Action: Create Similar Post ──
    if (action === "create_similar" && post) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          tools: [{
            type: "function",
            function: {
              name: "return_post",
              description: "Return a new social media post similar to the high-performing original.",
              parameters: {
                type: "object",
                properties: {
                  content: { type: "string", description: "New post caption" },
                  hashtags: { type: "array", items: { type: "string" } },
                  content_type: { type: "string", description: "Content category" },
                },
                required: ["content", "hashtags", "content_type"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "return_post" } },
          messages: [
            { role: "system", content: "You are a social media expert for service professionals. Create a new post inspired by the high-performing original. Keep the same tone and structure but with fresh content. Include relevant hashtags." },
            { role: "user", content: `Original high-performing post:\n"${post.content}"\nPlatforms: ${(post.platforms_json || []).join(", ")}\nPerformance: ${post.clicks || 0} clicks, ${post.leads_generated || 0} leads, ${post.bookings_generated || 0} bookings\n\nCreate a similar but fresh post.` },
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429 || status === 402) {
          return new Response(JSON.stringify({ error: status === 429 ? "Rate limit exceeded" : "Credits exhausted" }), {
            status, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI gateway error");
      }

      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      let newPost = { content: "", hashtags: [], content_type: "general" };
      if (toolCall?.function?.arguments) {
        try { newPost = JSON.parse(toolCall.function.arguments); } catch {}
      }

      // Create draft post
      const { error: insertError } = await supabase.from("social_posts").insert({
        user_id: user.id,
        content: newPost.content,
        platforms_json: post.platforms_json || ["Instagram"],
        status: "draft",
        approval_status: "draft",
        content_label: newPost.content_type || post.content_label,
        performance_notes: `Created from high-performing post. Original had ${post.clicks || 0} clicks, ${post.leads_generated || 0} leads.`,
      } as any);

      if (insertError) throw insertError;

      return new Response(JSON.stringify({ success: true, post: newPost }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Action: Improve Post ──
    if (action === "improve" && post) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          tools: [{
            type: "function",
            function: {
              name: "return_improvements",
              description: "Return specific improvements for this underperforming post.",
              parameters: {
                type: "object",
                properties: {
                  improved_content: { type: "string", description: "Improved version of the post" },
                  suggestions: { type: "array", items: { type: "string" }, description: "List of specific improvement tips" },
                },
                required: ["improved_content", "suggestions"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "return_improvements" } },
          messages: [
            { role: "system", content: "You are a social media optimization expert for service professionals. Analyze the underperforming post and provide an improved version with specific, actionable suggestions." },
            { role: "user", content: `Post to improve:\n"${post.content}"\nPlatforms: ${(post.platforms_json || []).join(", ")}\nPerformance: ${post.clicks || 0} clicks, ${post.leads_generated || 0} leads\n\nProvide an improved version and specific tips.` },
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429 || status === 402) {
          return new Response(JSON.stringify({ error: status === 429 ? "Rate limit exceeded" : "Credits exhausted" }), {
            status, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI gateway error");
      }

      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      let result = { improved_content: "", suggestions: [] as string[] };
      if (toolCall?.function?.arguments) {
        try { result = JSON.parse(toolCall.function.arguments); } catch {}
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Default: Generate Insights from all posts ──
    const postSummary = (posts || []).slice(0, 30).map((p: any) => ({
      content_snippet: (p.content || "").slice(0, 100),
      platforms: p.platforms_json,
      content_label: p.content_label,
      clicks: p.clicks || 0,
      link_clicks: p.link_clicks || 0,
      leads: p.leads_generated || 0,
      bookings: p.bookings_generated || 0,
      day: new Date(p.created_at).toLocaleDateString("en-US", { weekday: "short" }),
    }));

    const totalLeads = postSummary.reduce((s: number, p: any) => s + p.leads, 0);
    const totalClicks = postSummary.reduce((s: number, p: any) => s + p.clicks, 0);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        tools: [{
          type: "function",
          function: {
            name: "return_insights",
            description: "Return 3-5 actionable content performance insights.",
            parameters: {
              type: "object",
              properties: {
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Short headline (max 8 words)" },
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
          { role: "system", content: "You are a social media performance analyst for service professionals (contractors, barbers, realtors, landscapers). Analyze post performance data and provide 3-5 specific, actionable insights about what content generates the most leads and bookings. Reference actual numbers. Focus on patterns: which content types, platforms, posting days, and content styles perform best." },
          { role: "user", content: `Analyze these ${postSummary.length} published posts:\n${JSON.stringify(postSummary, null, 2)}\n\nTotal: ${totalClicks} clicks, ${totalLeads} leads across all posts.\n\nProvide insights on what content works best for generating leads.` },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429 || status === 402) {
        return new Response(JSON.stringify({ insights: [{ title: "AI temporarily unavailable", description: status === 429 ? "Rate limit exceeded. Try again shortly." : "Credits exhausted. Top up in Settings.", type: "info" }] }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let insights: any[] = [];
    if (toolCall?.function?.arguments) {
      try { insights = JSON.parse(toolCall.function.arguments).insights ?? []; } catch {}
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("content-performance-ai error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
