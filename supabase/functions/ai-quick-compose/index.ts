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

    const { topic, platforms, profession, company, city, services } = await req.json();

    const platformStr = (platforms && platforms.length > 0) ? platforms.join(", ") : "social media";
    const professionStr = profession || "small business owner";
    const companyStr = company ? ` for ${company}` : "";
    const cityStr = city ? ` in ${city}` : "";
    const servicesStr = (services && services.length > 0) ? `\nServices offered: ${services.join(", ")}` : "";

    const userPrompt = topic?.trim()
      ? `Write a social media post about: "${topic}" for a ${professionStr}${companyStr}${cityStr} posting on ${platformStr}.${servicesStr}`
      : `Write an engaging social media post for a ${professionStr}${companyStr}${cityStr} posting on ${platformStr}.${servicesStr}\nPick a creative angle — could be a tip, promotion, behind-the-scenes, testimonial prompt, or seasonal content.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a social media copywriter for tradespeople and small businesses. Write punchy, authentic posts that feel human — not corporate. Include emojis naturally. Keep captions under 280 chars for Twitter compatibility but engaging for all platforms. Always end with a clear CTA.`,
          },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "compose_post",
              description: "Return the composed social media post content",
              parameters: {
                type: "object",
                properties: {
                  content: { type: "string", description: "The full post caption with emojis and CTA" },
                  hashtags: {
                    type: "array",
                    items: { type: "string" },
                    description: "5-8 relevant hashtags without # prefix",
                  },
                },
                required: ["content", "hashtags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "compose_post" } },
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
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-quick-compose error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
