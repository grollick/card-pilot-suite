import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SECTION_PROMPTS: Record<string, { system: string; toolName: string; toolDesc: string; params: Record<string, any>; required: string[] }> = {
  hero: {
    system: "Generate a compelling hero section for a digital business card. Return a punchy tagline and a supporting subtitle.",
    toolName: "generate_hero",
    toolDesc: "Return hero section content",
    params: {
      tagline: { type: "string", description: "Short punchy tagline, max 80 chars" },
      subtitle: { type: "string", description: "Supporting subtitle, max 120 chars" },
    },
    required: ["tagline", "subtitle"],
  },
  about: {
    system: "Write a professional but warm about section for a digital business card. Be specific to the profession. 2-4 sentences, max 400 chars.",
    toolName: "generate_about",
    toolDesc: "Return about section text",
    params: {
      text: { type: "string", description: "About text, 2-4 sentences, max 400 chars" },
    },
    required: ["text"],
  },
  services: {
    system: "Generate 3-5 relevant services for a professional's business card. Include name, brief description, and a realistic price.",
    toolName: "generate_services",
    toolDesc: "Return services list",
    params: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "string" },
          },
          required: ["name", "description", "price"],
        },
        description: "3-5 services with name, description, price",
      },
    },
    required: ["items"],
  },
  testimonials: {
    system: "Generate 2-3 realistic-sounding testimonials for a professional's business card. Use believable names and specific praise.",
    toolName: "generate_testimonials",
    toolDesc: "Return testimonials list",
    params: {
      testimonials: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            text: { type: "string" },
            role: { type: "string" },
          },
          required: ["name", "text"],
        },
        description: "2-3 testimonials",
      },
    },
    required: ["testimonials"],
  },
  contact: {
    system: "Generate a contact section heading and a short description inviting visitors to reach out.",
    toolName: "generate_contact",
    toolDesc: "Return contact section content",
    params: {
      heading: { type: "string", description: "Section heading, max 40 chars" },
      description: { type: "string", description: "Description, 1-2 sentences, max 160 chars" },
    },
    required: ["heading", "description"],
  },
  booking: {
    system: "Generate a booking section heading that encourages visitors to schedule an appointment.",
    toolName: "generate_booking",
    toolDesc: "Return booking heading",
    params: {
      bookingHeading: { type: "string", description: "Booking section heading, max 50 chars" },
    },
    required: ["bookingHeading"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { section, profession, name, company } = await req.json();

    const config = SECTION_PROMPTS[section];
    if (!config) {
      return new Response(JSON.stringify({ error: `Unsupported section: ${section}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `Generate ${section} content for:
- Profession: ${profession || "Professional"}
- Name: ${name || "Not provided"}
- Company: ${company || "Not provided"}

Be specific and authentic. No generic filler.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: config.system },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: config.toolName,
              description: config.toolDesc,
              parameters: {
                type: "object",
                properties: config.params,
                required: config.required,
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: config.toolName } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI generation failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No content generated");

    const content = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-section-writer error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
