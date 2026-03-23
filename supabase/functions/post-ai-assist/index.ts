import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { templateName, profession, category, format, existingTexts, action } = await req.json();

    // action: "suggest_content" | "find_images"
    const isImageSearch = action === "find_images";

    const systemPrompt = isImageSearch
      ? `You are a creative director for social media marketing. Given the template context, suggest 4 relevant stock photo search queries that would work perfectly for this social media post. Return varied, specific queries that a professional would use. Focus on high-quality, professional imagery.`
      : `You are a social media marketing expert for small businesses. Given a post template context, generate compelling content suggestions. Be specific to the trade/profession. Keep captions punchy and engaging (under 200 chars). Generate 5-8 relevant hashtags. Create a strong CTA. Also suggest alternative headline and subheadline text that fits the template.`;

    const userPrompt = isImageSearch
      ? `Template: "${templateName}"
Profession: ${profession}
Category: ${category}
Format: ${format}
Current text on the post: ${existingTexts?.join(", ") || "none"}

Suggest 4 specific image search queries for stock photos that would look great in this social media post.`
      : `Template: "${templateName}"
Profession: ${profession}
Category: ${category}
Format: ${format}
Current text on the post: ${existingTexts?.join(", ") || "none"}

Generate social media content suggestions for this post template.`;

    const tools = isImageSearch
      ? [
          {
            type: "function",
            function: {
              name: "suggest_images",
              description: "Return 4 image search queries for stock photos",
              parameters: {
                type: "object",
                properties: {
                  queries: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        query: { type: "string", description: "Search query for Unsplash/stock photo" },
                        description: { type: "string", description: "Brief description of what the image should show" },
                      },
                      required: ["query", "description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["queries"],
                additionalProperties: false,
              },
            },
          },
        ]
      : [
          {
            type: "function",
            function: {
              name: "suggest_content",
              description: "Return social media content suggestions",
              parameters: {
                type: "object",
                properties: {
                  caption: { type: "string", description: "Engaging social media caption (under 200 chars)" },
                  hashtags: { type: "array", items: { type: "string" }, description: "5-8 relevant hashtags without # prefix" },
                  cta: { type: "string", description: "Call-to-action text for the post badge/button" },
                  headline: { type: "string", description: "Suggested headline text for the post" },
                  subheadline: { type: "string", description: "Suggested subheadline text" },
                  alternativeHeadlines: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 alternative headline options",
                  },
                },
                required: ["caption", "hashtags", "cta", "headline", "subheadline"],
                additionalProperties: false,
              },
            },
          },
        ];

    const toolChoice = isImageSearch
      ? { type: "function", function: { name: "suggest_images" } }
      : { type: "function", function: { name: "suggest_content" } };

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
        tools,
        tool_choice: toolChoice,
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
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned");

    const result = JSON.parse(toolCall.function.arguments);

    // If image search, fetch actual images from Unsplash
    if (isImageSearch && result.queries) {
      const images = await Promise.all(
        result.queries.map(async (q: { query: string; description: string }) => {
          try {
            // Use Unsplash source for free images (no API key needed)
            const unsplashUrl = `https://loremflickr.com/800/600/${encodeURIComponent(q.query)}`;
            return {
              url: unsplashUrl,
              query: q.query,
              description: q.description,
            };
          } catch {
            return { url: null, query: q.query, description: q.description };
          }
        })
      );
      return new Response(JSON.stringify({ images }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("post-ai-assist error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
