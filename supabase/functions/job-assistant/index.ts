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

    const { messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather user's business context in parallel
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const [
      { data: profile },
      { data: recentLeads },
      { data: recentJobs },
      { data: recentEstimates },
      { data: services },
      { data: recentActivities },
    ] = await Promise.all([
      supabase.from("profiles").select("name, company, bio, city, phone, email, plan, handle").eq("id", user.id).single(),
      supabase.from("leads").select("id, name, email, phone, status, source, created_at, last_activity_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("jobs").select("id, title, job_number, status, job_type, job_address, scheduled_start, actual_start, actual_end, notes").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("estimates").select("id, estimate_number, status, grand_total, job_type, job_address, scope_of_work, lead_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("booking_services").select("name, price, duration_min").eq("user_id", user.id).eq("active", true).limit(20),
      supabase.from("contact_activities").select("title, activity_type, occurred_at").eq("user_id", user.id).order("occurred_at", { ascending: false }).limit(15),
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

    // Build context string
    const contextParts: string[] = [];

    if (profile) {
      contextParts.push(`Business: ${profile.company || profile.name || "Unknown"}, located in ${profile.city || "unknown city"}.`);
      if (profile.bio) contextParts.push(`Bio: ${profile.bio}`);
    }

    if (services && services.length > 0) {
      contextParts.push(`Services offered: ${services.map(s => `${s.name} ($${s.price || 0})`).join(", ")}`);
    }

    if (recentLeads && recentLeads.length > 0) {
      const openLeads = recentLeads.filter(l => l.status === "open");
      contextParts.push(`CRM: ${recentLeads.length} recent contacts, ${openLeads.length} open leads.`);
      if (openLeads.length > 0) {
        contextParts.push(`Open leads: ${openLeads.slice(0, 5).map(l => l.name).join(", ")}`);
      }
    }

    if (recentJobs && recentJobs.length > 0) {
      const activeJobs = recentJobs.filter(j => ["scheduled", "in_progress"].includes(j.status));
      const completedJobs = recentJobs.filter(j => j.status === "completed");
      contextParts.push(`Jobs: ${activeJobs.length} active, ${completedJobs.length} completed recently.`);
      if (activeJobs.length > 0) {
        contextParts.push(`Active jobs: ${activeJobs.map(j => `${j.title} (${j.status})`).join("; ")}`);
      }
    }

    if (recentEstimates && recentEstimates.length > 0) {
      const pendingEstimates = recentEstimates.filter(e => e.status === "sent");
      const totalValue = recentEstimates.reduce((sum, e) => sum + Number(e.grand_total || 0), 0);
      contextParts.push(`Estimates: ${recentEstimates.length} recent (total value: $${totalValue.toLocaleString()}), ${pendingEstimates.length} awaiting approval.`);
    }

    if (recentActivities && recentActivities.length > 0) {
      contextParts.push(`Recent activity: ${recentActivities.slice(0, 5).map(a => a.title).join("; ")}`);
    }

    const systemPrompt = `You are CardPilot AI Assistant — a smart, friendly business assistant for trades professionals and service businesses.

You help with:
- Generating estimates (line items, labor, materials, scope of work)
- Writing customer messages (follow-ups, confirmations, review requests)
- Creating marketing content (social posts, email campaigns, promotions)
- Analyzing business performance and suggesting improvements
- Generating job scopes and summaries
- Answering business questions

USER'S BUSINESS CONTEXT:
${contextParts.join("\n")}

GUIDELINES:
- Be concise, professional, and action-oriented
- When generating estimates, format them clearly with line items, quantities, and prices
- When writing messages, adapt tone to the profession
- Use markdown formatting for readability
- Reference the user's actual data when relevant (services, leads, jobs)
- If asked to generate an estimate, include a structured breakdown
- For marketing content, make it engaging and profession-appropriate
- Keep responses focused and practical — this user is busy working in the field`;

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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
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
    console.error("job-assistant error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
