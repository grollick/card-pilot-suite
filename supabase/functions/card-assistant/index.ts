import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are CardPilot AI — a friendly, expert assistant built into the Card Builder. You help users create compelling digital business cards.

Your capabilities:
- Write professional bios, taglines, about sections, and service descriptions
- Suggest section content tailored to the user's profession
- Give advice on card design, layout, and what sections to enable
- Help craft testimonial requests to send to clients
- Suggest social media bio text
- Advise on CTAs and lead capture strategy

Context about the user will be provided. Use it to give personalized, profession-specific advice.

Rules:
- Keep responses concise and actionable (2-4 paragraphs max)
- When writing content, provide it in a ready-to-copy format
- Use markdown formatting for clarity
- Be warm and encouraging — many users are solopreneurs building their first digital presence
- If asked about features outside the card builder, briefly mention the relevant CardPilot feature (bookings, CRM, email, etc.)`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    if (!messages?.length) throw new Error("Messages are required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contextBlock = context
      ? `\n\nUser context:\n- Name: ${context.name || "Unknown"}\n- Profession: ${context.profession || "Unknown"}\n- Company: ${context.company || "N/A"}\n- Sections enabled: ${context.sections || "N/A"}\n- Has avatar: ${context.hasAvatar ? "Yes" : "No"}\n- Has backdrop: ${context.hasBackdrop ? "Yes" : "No"}\n- Card status: ${context.cardStatus || "draft"}`
      : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextBlock },
          ...messages,
        ],
        stream: true,
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
      throw new Error("AI assistant error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    console.error("card-assistant error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
