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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, job_id, notes, photo_urls, service_type } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather context
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const [{ data: profile }, { data: job }, { data: services }] = await Promise.all([
      supabase.from("profiles").select("name, company, bio, city, plan").eq("id", user.id).single(),
      job_id
        ? supabase.from("jobs").select("id, title, job_number, status, job_type, job_address, notes, lead_id, leads(name, email, phone)").eq("id", job_id).single()
        : Promise.resolve({ data: null }),
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
    if (profile) {
      contextParts.push(`Business: ${profile.company || profile.name || "Service Pro"}, ${profile.city || "unknown city"}.`);
    }
    if (services && services.length > 0) {
      contextParts.push(`Services offered: ${services.map((s: any) => `${s.name} ($${s.price || 0})`).join(", ")}`);
    }
    if (job) {
      contextParts.push(`Current job: "${job.title}" (${job.job_type || "General"}) at ${job.job_address || "no address"}.`);
      if ((job as any).leads) {
        const lead = (job as any).leads;
        contextParts.push(`Customer: ${lead.name}${lead.phone ? `, ${lead.phone}` : ""}`);
      }
      if (job.notes) contextParts.push(`Existing notes: ${job.notes.slice(0, 500)}`);
    }

    let userPrompt = "";
    const messages: any[] = [];

    if (action === "analyze_photos") {
      userPrompt = `Analyze these job-site photos and provide:
1. **Services Needed** — list specific services visible
2. **Scope of Work** — detailed items to address
3. **Before/After Opportunity** — whether this is a good candidate for before/after documentation
4. **Recommended Follow-up** — actions to take
5. **Upsell Suggestions** — related services the customer might need

Be specific and practical. Format with markdown.`;

      if (photo_urls && photo_urls.length > 0) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            ...photo_urls.map((url: string) => ({
              type: "image_url",
              image_url: { url },
            })),
          ],
        });
      } else {
        userPrompt = "No photos were provided. Please ask the technician to upload job-site photos for analysis.";
        messages.push({ role: "user", content: userPrompt });
      }
    } else if (action === "clean_notes") {
      userPrompt = `Turn these rough field notes into a professional job summary. Keep all details but make it clear, organized, and professional. Use short paragraphs.

Raw notes: "${notes}"

Output ONLY the cleaned-up summary, nothing else.`;
      messages.push({ role: "user", content: userPrompt });
    } else if (action === "draft_estimate") {
      userPrompt = `Generate a draft estimate structure for this job. Include:
1. **Estimate Summary** — one paragraph scope of work
2. **Line Items** — table with: Item | Qty | Unit | Unit Price | Total
3. **Materials** — list with estimated costs
4. **Labor** — categories and estimated hours
5. **Recommended Add-ons** — optional upsell items

${notes ? `Technician notes: "${notes}"` : ""}
${service_type ? `Service type: ${service_type}` : ""}
${photo_urls?.length ? "Photos were provided for reference." : ""}

Use realistic pricing for the trade. Format as markdown.`;

      if (photo_urls && photo_urls.length > 0) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            ...photo_urls.map((url: string) => ({
              type: "image_url",
              image_url: { url },
            })),
          ],
        });
      } else {
        messages.push({ role: "user", content: userPrompt });
      }
    } else if (action === "suggest_services") {
      userPrompt = `Based on the current job context, suggest 3-5 related services that could be offered to this customer as upsells or follow-up work. For each:
- Service name
- Why it's relevant
- Estimated price range
- Urgency (now / next visit / seasonal)

${notes ? `Context from technician: "${notes}"` : ""}
Format as markdown cards.`;
      messages.push({ role: "user", content: userPrompt });
    } else if (action === "follow_up") {
      userPrompt = `Based on this job, recommend the best next actions. Provide 3-5 actionable follow-up items:
- What action to take
- Why it matters
- Priority (high/medium/low)
- Suggested timeline

${notes ? `Technician notes: "${notes}"` : ""}
Format as a prioritized list with markdown.`;
      messages.push({ role: "user", content: userPrompt });
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a field service AI assistant for trades professionals. You help technicians capture job info faster, write professional notes, and create estimates.

BUSINESS CONTEXT:
${contextParts.join("\n")}

GUIDELINES:
- Be concise and action-oriented — this user is working in the field
- Use markdown for readability
- Provide realistic pricing based on the trade
- Focus on practical, actionable output
- When analyzing photos, be specific about what you see`;

    const model = photo_urls?.length > 0 ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
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
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    console.error("tech-assist error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
