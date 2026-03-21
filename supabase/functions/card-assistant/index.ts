import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `You are guzzl.pro AI — a friendly, expert assistant built into the Card Builder. You help users create compelling digital business cards.

Your capabilities:
- Write professional bios, taglines, about sections, and service descriptions
- Suggest section content tailored to the user's profession
- Give advice on card design, layout, and what sections to enable
- Help craft testimonial requests to send to clients
- Suggest social media bio text
- Advise on CTAs and lead capture strategy
- Explain the Scan to Save feature (lets card visitors scan their own business card to share contact info with the card owner)
- Help users understand contact categories (lead, client, vendor, partner, personal, other)
- Explain the Business Card Scanner (scan physical cards with camera to auto-create CRM contacts)

Context about the user will be provided. Use it to give personalized, profession-specific advice.

Rules:
- Keep responses concise and actionable (2-4 paragraphs max)
- When writing content, provide it in a ready-to-copy format
- Use markdown formatting for clarity
- Be warm and encouraging — many users are solopreneurs building their first digital presence
- If asked about features outside the card builder, briefly mention the relevant guzzl.pro feature (bookings, CRM, email, etc.)
- If asked about scanning: the "Scan to Save" toggle in card settings lets visitors photograph their own card to become a contact. The "Business Card Scanner" under Contacts lets the user scan others' cards.

EXTERNAL RESOURCES:
Always enrich your advice with relevant external resources the user can explore:
- Suggest design inspiration sites (e.g., [Dribbble](https://dribbble.com), [Behance](https://behance.net)) for card design ideas
- Link to professional headshot guides, branding articles, or copywriting tips
- Recommend tools for creating assets (e.g., [Canva](https://canva.com), [Remove.bg](https://remove.bg))
- Point to relevant industry directories or review platforms where they should have a presence
- When discussing bio writing, link to copywriting resources or examples
- Format links as markdown: [Resource Name](https://url.com)
- Include 1-2 external references per response where relevant`;

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

    const { messages, context } = await req.json();
    if (!messages?.length) throw new Error("Messages are required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch AI personality preference
    const { data: profileData } = await supabase
      .from("profiles")
      .select("ai_personality")
      .eq("id", user.id)
      .maybeSingle();
    const personality = (profileData as any)?.ai_personality || "copilot";

    const personalityInstructions: Record<string, string> = {
      copilot: "Be concise and action-oriented. Short tips, quick fixes, bullet points. Under 3 paragraphs.",
      chatgpt: "Be thorough and conversational. Detailed explanations, multiple options, rich markdown.",
      coach: "Be proactive and motivational. Numbered action steps, priorities, encouragement.",
      minimal: "Be extremely brief. Short sentences, no fluff. Max 2-3 sentences.",
    };
    const toneInstruction = personalityInstructions[personality] || personalityInstructions.copilot;

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
          { role: "system", content: BASE_SYSTEM_PROMPT + `\n\nCOMMUNICATION STYLE:\n${toneInstruction}` + contextBlock },
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
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
