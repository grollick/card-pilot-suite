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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { content, tone } = await req.json();
    if (!content?.trim()) throw new Error("Content is required");

    const tones = ["professional", "casual", "bold", "humorous", "inspirational"];
    const targetTones = tones.filter(t => t !== tone).slice(0, 3);
    // Also include the current tone reworded
    targetTones.unshift(tone);

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
            content: `You are a social media copywriter. Rewrite the given post caption in different tones while keeping the core message. Keep each variation concise and engaging. Each should be ready to post.`,
          },
          {
            role: "user",
            content: `Rewrite this social media post in 4 different tones: ${targetTones.join(", ")}.\n\nOriginal post:\n"${content}"`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_variations",
              description: "Return caption variations in different tones",
              parameters: {
                type: "object",
                properties: {
                  variations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tone: { type: "string", description: "The tone used" },
                        label: { type: "string", description: "Short label for this tone" },
                        caption: { type: "string", description: "The rewritten caption" },
                      },
                      required: ["tone", "label", "caption"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["variations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_variations" } },
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

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("spin-content error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
