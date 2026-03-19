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

    // Get user's profession
    const { data: profile } = await sb
      .from("profiles")
      .select("name, company, city, profession_id, professions(name, category)")
      .eq("id", user.id)
      .single();

    const professionName = (profile as any)?.professions?.name ?? "service professional";
    const professionCategory = (profile as any)?.professions?.category ?? "general";
    const city = (profile as any)?.city ?? "";
    const company = (profile as any)?.company ?? "";

    const { platforms, topic } = await req.json();

    const systemPrompt = `You are a social media marketing expert specializing in content for ${professionName}s (${professionCategory} industry).
You create highly engaging, platform-optimized social media posts.
Business: ${company || "a local " + professionName} ${city ? "in " + city : ""}.
Be specific to the trade. Use industry terminology. Sound authentic, not generic.`;

    const userPrompt = `Generate 4 unique social media post ideas${topic ? ` about: "${topic}"` : ""} for a ${professionName}.
Target platforms: ${platforms?.join(", ") || "Instagram, Facebook"}.

Each post should have a completely different angle/approach:
1. A showcase/portfolio style post
2. An educational tip or how-to
3. A promotional/offer post  
4. A behind-the-scenes or personal/relatable post

For each post, also suggest a specific stock photo search query that would pair perfectly with it.`;

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
              name: "generate_post_ideas",
              description: "Generate 4 social media post variations with image suggestions",
              parameters: {
                type: "object",
                properties: {
                  posts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short label for this post idea (3-5 words)" },
                        caption: { type: "string", description: "Full post caption (2-4 sentences, engaging, under 300 chars)" },
                        hashtags: { type: "array", items: { type: "string" }, description: "5-8 relevant hashtags without #" },
                        cta: { type: "string", description: "Call-to-action line" },
                        image_query: { type: "string", description: "Specific stock photo search query" },
                        image_description: { type: "string", description: "What the ideal image should show" },
                        style: { type: "string", enum: ["showcase", "educational", "promotional", "personal"], description: "Post style category" },
                      },
                      required: ["title", "caption", "hashtags", "cta", "image_query", "image_description", "style"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["posts"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_post_ideas" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    // Attach Unsplash image URLs to each post
    if (result.posts) {
      for (const post of result.posts) {
        post.image_url = `https://source.unsplash.com/800x600/?${encodeURIComponent(post.image_query)}`;
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-post-ideas error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
