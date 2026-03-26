import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let lead_id: string;
    try {
      const body = await req.json();
      lead_id = body.lead_id;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid or missing request body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch lead + profile + activities
    const [{ data: lead }, { data: profile }, { data: activities }] = await Promise.all([
      supabase.from("leads").select("*").eq("id", lead_id).eq("user_id", user.id).single(),
      supabase.from("profiles").select("name, company, profession, phone, email, city").eq("id", user.id).single(),
      supabase.from("contact_activities").select("activity_type, title, description, occurred_at")
        .eq("lead_id", lead_id).order("occurred_at", { ascending: false }).limit(10),
    ]);

    if (!lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({
        draft: `Hi ${lead.name},\n\nThank you for reaching out! I'd love to help. Could you share a few more details about what you need?\n\nBest,\n${profile?.name || ""}`,
        tone: "professional",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const context = `My business: ${profile?.company || profile?.name || "Unknown"} (${profile?.profession || "service professional"})
My city: ${profile?.city || "local area"}

Lead info:
- Name: ${lead.name}
- Email: ${lead.email || "none"}
- Phone: ${lead.phone || "none"}
- Source: ${lead.source}
- Company: ${lead.company || "none"}
- Created: ${lead.created_at}
- Custom fields: ${JSON.stringify(lead.custom_fields_json || {})}

Recent activity:
${(activities ?? []).map(a => `- ${a.activity_type}: ${a.title}`).join("\n") || "No activity yet"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        tools: [{
          type: "function",
          function: {
            name: "draft_reply",
            description: "Draft a personalized reply message to the lead",
            parameters: {
              type: "object",
              properties: {
                subject: { type: "string", description: "Email subject line" },
                draft: { type: "string", description: "Full reply message, ready to send. Use line breaks for paragraphs." },
                tone: { type: "string", enum: ["friendly", "professional", "urgent"] },
                follow_up_suggestion: { type: "string", description: "What to do next if they don't respond" },
              },
              required: ["subject", "draft", "tone", "follow_up_suggestion"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "draft_reply" } },
        messages: [
          { role: "system", content: "You are an expert at writing personalized business replies that convert leads into customers. Write warm, personal, concise messages. Reference specific details from their inquiry. Always include a clear next step or call to action. Keep it under 100 words. Sign off with the business owner's name." },
          { role: "user", content: context },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({
          draft: `Hi ${lead.name},\n\nThank you for reaching out! I'd love to discuss how I can help. When would be a good time to chat?\n\nBest,\n${profile?.name || ""}`,
          tone: "professional",
          subject: `Re: Your inquiry`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result = { draft: "", subject: "", tone: "professional", follow_up_suggestion: "" };
    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch { /* use default */ }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-reply-draft error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
