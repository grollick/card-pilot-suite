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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await sb.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Get user's profession for trade-specific content
    const { data: profile } = await sb
      .from("profiles")
      .select("name, company, city, profession_id, professions(name, category)")
      .eq("id", user.id)
      .single();

    const professionName = (profile as any)?.professions?.name ?? "service professional";
    const professionCategory = (profile as any)?.professions?.category ?? "general";
    const city = (profile as any)?.city ?? "";
    const company = (profile as any)?.company ?? "";

    const { search } = await req.json();

    const systemPrompt = `You are a social media content strategist for ${professionName}s (${professionCategory} industry).
Business: ${company || "a local " + professionName} ${city ? "in " + city : ""}.
Generate a mix of content ideas that are highly relevant to this specific trade.
Include trending topics, industry-specific ideas, ready-to-use posts, and seasonal content.
Be specific to the trade. Use industry terminology. Sound authentic.`;

    const userPrompt = `Generate 8 social media content ideas for a ${professionName}${search ? ` related to: "${search}"` : ""}.

Mix of categories:
- 2 trending topics in the ${professionCategory} industry
- 2 industry-specific ideas
- 2 ready-to-use posts
- 2 seasonal/timely content

Each should be a complete, ready-to-post piece with image suggestions.`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "return_content_feed",
              description: "Return content feed items",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short title (3-6 words)" },
                        caption: { type: "string", description: "Full post caption (2-4 sentences)" },
                        hashtags: { type: "array", items: { type: "string" }, description: "5-8 hashtags without #" },
                        cta: { type: "string", description: "Call-to-action line" },
                        image_query: { type: "string", description: "Stock photo search query" },
                        category: { type: "string", enum: ["trending", "industry", "ready_to_use", "seasonal"] },
                      },
                      required: ["title", "caption", "hashtags", "cta", "image_query", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_content_feed" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
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
      throw new Error("AI generation failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned");

    const result = JSON.parse(toolCall.function.arguments);

    // Attach image URLs
    if (result.items) {
      for (let i = 0; i < result.items.length; i++) {
        const item = result.items[i];
        item.image_url = `https://loremflickr.com/800/600/${encodeURIComponent(item.image_query)}?random=${i + Date.now()}`;
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content-feed error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
