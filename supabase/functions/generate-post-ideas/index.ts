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

    // Fetch profile AND services in parallel
    const [profileResult, servicesResult] = await Promise.all([
      sb.from("profiles")
        .select("name, company, city, profession_id, professions(name, category)")
        .eq("id", user.id)
        .single(),
      sb.from("booking_services")
        .select("name, description, price")
        .eq("user_id", user.id)
        .eq("active", true)
        .limit(10),
    ]);

    const profile = profileResult.data as any;
    const services = servicesResult.data ?? [];

    const professionName = profile?.professions?.name ?? "service professional";
    const professionCategory = profile?.professions?.category ?? "general";
    const city = profile?.city ?? "";
    const company = profile?.company ?? "";
    const userName = profile?.name ?? "";

    // Build services context
    const servicesList = services.map((s: any) => {
      let line = s.name;
      if (s.price) line += ` ($${s.price})`;
      if (s.description) line += ` — ${s.description}`;
      return line;
    });
    const servicesContext = servicesList.length > 0
      ? `\nServices offered:\n${servicesList.map((s: string) => `• ${s}`).join("\n")}`
      : "";

    const { platforms, topic, count } = await req.json();
    const postCount = Math.min(count || 4, 6);

    const systemPrompt = `You are a social media marketing expert specializing in content for ${professionName}s (${professionCategory} industry).
You create highly engaging, platform-optimized social media posts.
Business: ${company || "a local " + professionName}${userName ? ` run by ${userName}` : ""} ${city ? "in " + city : ""}.${servicesContext}

CRITICAL RULES:
- Every post MUST directly relate to this specific ${professionName} business and their actual services
- Reference real services, pricing, and location when relevant
- Use trade-specific terminology and scenarios
- Sound authentic and personal, NOT generic or templated
- Include the city/area name when it makes sense for local marketing`;

    const userPrompt = `Generate ${postCount} unique social media post ideas${topic ? ` about: "${topic}"` : ""} for this ${professionName} business.
Target platforms: ${platforms?.join(", ") || "Instagram, Facebook"}.

Each post should have a completely different angle:
1. A showcase/portfolio style post highlighting a specific service
2. An educational tip or how-to related to their trade
3. A promotional/offer post for one of their actual services
4. A behind-the-scenes or personal/relatable post
${postCount > 4 ? "5. A seasonal/timely post relevant to their trade\n6. A customer testimonial-style post" : ""}

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
              description: `Generate ${postCount} social media post variations with image suggestions`,
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
    if (result.posts) {
      for (let i = 0; i < result.posts.length; i++) {
        const post = result.posts[i];
        const seed = encodeURIComponent(post.image_query).slice(0, 50) + i;
        post.image_url = `https://picsum.photos/seed/${seed}/800/600`;
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-post-ideas error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
