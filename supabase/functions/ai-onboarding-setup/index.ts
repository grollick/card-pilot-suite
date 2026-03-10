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
    if (!profession) throw new Error("Profession is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert business setup consultant for digital business cards. Given a profession, generate a complete business card setup with realistic, industry-specific content.

Be specific to the profession. Use real-world service names and realistic pricing for the market. Content should be professional but approachable.`;

    const userPrompt = `Generate a complete card setup for:
- Profession: ${profession}
- Name: ${name || "Not provided"}
- Company: ${company || "Not provided"}  
- City: ${city || "Not provided"}

Create realistic, specific content for this exact profession.`;

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
              name: "generate_onboarding_setup",
              description: "Return a complete business card setup for the given profession",
              parameters: {
                type: "object",
                properties: {
                  tagline: { type: "string", description: "Short professional tagline, max 80 chars" },
                  bio: { type: "string", description: "1-2 sentence professional bio, max 160 chars" },
                  about: { type: "string", description: "2-3 sentence about section, max 300 chars" },
                  cta_text: { type: "string", description: "Call-to-action button text, max 30 chars" },
                  services: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Service name" },
                        description: { type: "string", description: "Brief description, max 80 chars" },
                        duration_min: { type: "number", description: "Typical duration in minutes" },
                        price_range: { type: "string", description: "Price range like '$50-$100' or 'From $75'" },
                      },
                      required: ["name", "description", "duration_min", "price_range"],
                      additionalProperties: false,
                    },
                    description: "5-6 profession-specific services with details",
                  },
                  suggested_template: {
                    type: "string",
                    enum: ["modern", "service-pro", "portfolio-showcase", "contractor-pro", "consultant-executive", "health-wellness", "beauty-glam", "educator-coach", "food-events", "auto-specialist"],
                    description: "Best matching card template ID for this profession",
                  },
                  setup_tips: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 short tips for this profession's card setup",
                  },
                },
                required: ["tagline", "bio", "about", "cta_text", "services", "suggested_template", "setup_tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_onboarding_setup" } },
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
      throw new Error("AI setup generation failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No setup content generated");
    }

    const content = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, setup: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-onboarding-setup error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
