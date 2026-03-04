import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profession, name, company, city } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a professional copywriter for digital business cards. Generate concise, compelling content for a ${profession}.

Return a JSON object with these exact keys:
- bio: A 1-2 sentence professional bio (max 160 chars)
- about: A 2-3 sentence about section (max 300 chars)
- tagline: A short tagline/headline (max 80 chars)
- cta_text: A call-to-action phrase (max 40 chars)
- services: An array of 3-4 service names relevant to this profession
- instagram_bio: A short Instagram-style bio with emoji (max 150 chars)

Make content specific to the person's name, company, and location if provided.
Use a confident, professional but approachable tone.
Do NOT use generic filler. Be specific to the profession.`;

    const userPrompt = `Generate card content for:
- Profession: ${profession}
- Name: ${name || "Not provided"}
- Company: ${company || "Not provided"}
- City/Location: ${city || "Not provided"}`;

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
                  bio: { type: "string", description: "1-2 sentence professional bio" },
                  about: { type: "string", description: "2-3 sentence about section" },
                  tagline: { type: "string", description: "Short tagline/headline" },
                  cta_text: { type: "string", description: "Call-to-action phrase" },
                  services: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 service names",
                  },
                  instagram_bio: { type: "string", description: "Instagram-style bio with emoji" },
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
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});