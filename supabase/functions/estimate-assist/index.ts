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

    const { action, job_type, scope, notes, customer_name, job_address, existing_items } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather business context
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const [{ data: profile }, { data: services }] = await Promise.all([
      supabase.from("profiles").select("name, company, bio, city, plan").eq("id", user.id).single(),
      supabase.from("booking_services").select("name, price, duration_min").eq("user_id", user.id).eq("active", true).limit(20),
    ]);

    // Check AI usage limits
    const planKey = profile?.plan || "starter";
    const aiLimits: Record<string, number> = { starter: 5, free: 5, growth: 50, pro: 500, agency: -1 };
    const limit = aiLimits[planKey] ?? 5;

    const { data: usageCheck, error: usageError } = await adminClient.rpc("check_and_increment_ai_usage", {
      p_user_id: user.id,
      p_limit: limit,
    });

    if (usageError || !usageCheck?.allowed) {
      const current = usageCheck?.current ?? 0;
      return new Response(JSON.stringify({
        error: `AI limit reached (${current}/${limit} requests this month). Upgrade your plan for more AI requests.`,
        code: "AI_LIMIT_REACHED",
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contextParts: string[] = [];
    if (profile) contextParts.push(`Business: ${profile.company || profile.name || "Service Pro"}, ${profile.city || ""}`);
    if (services?.length) contextParts.push(`Services offered: ${services.map((s: any) => `${s.name} ($${s.price || 0})`).join(", ")}`);
    if (job_type) contextParts.push(`Job type: ${job_type}`);
    if (scope) contextParts.push(`Scope of work: ${scope}`);
    if (customer_name) contextParts.push(`Customer: ${customer_name}`);
    if (job_address) contextParts.push(`Job address: ${job_address}`);

    let userPrompt = "";

    if (action === "generate_line_items") {
      userPrompt = `Generate detailed estimate line items for this job. Return ONLY a JSON array of objects with these exact fields:
- "title": string (item name)
- "description": string (brief description)
- "quantity": number
- "unit": string (e.g. "each", "sqft", "hour", "linear ft")
- "unit_price": number (realistic market price)
- "labor_hours": number
- "labor_rate": number (typical rate for the trade)
- "material_cost": number
- "markup_percent": number (typically 10-25)
- "tax_percent": number (0 if not applicable)

Generate 4-8 realistic line items. Use market-rate pricing for the trade and location.
${notes ? `\nAdditional context: "${notes}"` : ""}
${existing_items ? `\nExisting items (generate DIFFERENT ones): ${JSON.stringify(existing_items)}` : ""}

Return ONLY the JSON array, no markdown, no explanation.`;
    } else if (action === "write_scope") {
      userPrompt = `Write a professional scope-of-work description for this estimate. Be detailed but concise (2-3 paragraphs). Include:
- Work to be performed
- Materials and methods
- What's included/excluded
- Timeline expectations

${notes ? `Notes: "${notes}"` : ""}
${existing_items ? `Line items for context: ${JSON.stringify(existing_items.map((i: any) => i.title))}` : ""}

Return ONLY the scope text, no markdown headers.`;
    } else if (action === "write_terms") {
      userPrompt = `Write professional terms & conditions for a ${job_type || "service"} estimate. Include:
- Payment terms (deposit, progress payments, final)
- Warranty information
- Change order policy
- Timeline/scheduling
- Cancellation policy

Keep it to 5-7 bullet points. Be professional but fair. Return ONLY the terms text.`;
    } else if (action === "review_estimate") {
      userPrompt = `Review this estimate and provide feedback:

Job Type: ${job_type || "General"}
Scope: ${scope || "Not specified"}
Line Items: ${JSON.stringify(existing_items || [])}

Provide:
1. **Pricing Check** — Are prices competitive? Too high/low?
2. **Missing Items** — Anything commonly forgotten?
3. **Profit Analysis** — Quick margin assessment
4. **Improvement Tips** — How to strengthen this estimate
5. **Win Rate Tips** — Suggestions to improve approval chances

Be concise and actionable. Format with markdown.`;
    } else if (action === "suggest_upsells") {
      userPrompt = `Based on this ${job_type || "service"} estimate, suggest 3-5 optional add-on items the customer might want. For each:
- Item name and description
- Estimated price
- Why the customer would want it
- How to present it

${existing_items ? `Current items: ${JSON.stringify(existing_items.map((i: any) => i.title))}` : ""}
Format as markdown.`;
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert estimating assistant for trades and service businesses. You help create accurate, professional estimates that win jobs.

BUSINESS CONTEXT:
${contextParts.join("\n")}

GUIDELINES:
- Use realistic market pricing for the trade and area
- Be specific with quantities and measurements
- Include both labor and materials where applicable
- Consider industry-standard markup and tax rates
- Focus on winning the job — professional, thorough, fair pricing

EXTERNAL RESOURCES:
When relevant, include helpful external references:
- Link to material pricing resources (e.g., [HomeAdvisor Cost Guides](https://www.homeadvisor.com/cost/), [RSMeans](https://www.rsmeans.com))
- Suggest industry pricing benchmarks or calculators
- Reference trade-specific best practices from associations (NAHB, NARI, etc.)
- Point to contract templates or legal resources (e.g., [SBA contract templates](https://www.sba.gov))
- Format links as markdown: [Resource Name](https://url.com)`;

    const useJson = action === "generate_line_items";

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
        stream: !useJson,
        ...(useJson ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (useJson) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";
      return new Response(JSON.stringify({ result: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    console.error("estimate-assist error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
