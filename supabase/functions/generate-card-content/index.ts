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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profession, name, company, city } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an elite copywriter for digital business cards. Generate content that makes potential customers want to take action immediately.

QUALITY RULES — FOLLOW STRICTLY:
1. NO generic fluff: never use "passionate professional", "years of experience", "dedicated to excellence" or similar clichés
2. NO placeholders or brackets
3. NO repetition — each field must communicate something unique
4. Be SPECIFIC to the profession — use real service names and real customer outcomes
5. Write like a confident human, not a corporate brochure
6. Every sentence must pass the "so what?" test — if a customer wouldn't care, cut it
7. The tagline should be punchy and memorable (NOT a mission statement)
8. Services must be real offerings this profession provides
9. CTA text should inspire action without being pushy
10. Focus on CUSTOMER OUTCOMES, not self-praise
11. Instagram bio should feel natural with relevant emoji — not stuffed with hashtags`;

    const userPrompt = `Generate card content for a ${profession}.
- Name: ${name || "Not provided"}
- Company: ${company || "Not provided"}
- City/Location: ${city || "Not provided"}

Write content that would make someone think "I need to contact this person."`;

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
              name: "generate_card_content",
              description: "Return generated card content fields",
              parameters: {
                type: "object",
                properties: {
                  bio: { type: "string", description: "1-2 sentence professional bio focused on customer value — max 160 chars" },
                  about: { type: "string", description: "2-3 sentence about section showing WHY to choose this person — max 300 chars" },
                  tagline: { type: "string", description: "Punchy, memorable headline — max 60 chars" },
                  cta_text: { type: "string", description: "Action-driven button text — max 25 chars. Examples: 'Get a Free Quote', 'Book Now'" },
                  services: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 real, specific service names this profession actually offers",
                  },
                  instagram_bio: { type: "string", description: "Instagram-style bio with 2-3 relevant emoji — max 150 chars. Natural, not hashtag-stuffed." },
                },
                required: ["bio", "about", "tagline", "cta_text", "services", "instagram_bio"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_card_content" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI generation failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No content generated");
    }

    const content = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-card-content error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
