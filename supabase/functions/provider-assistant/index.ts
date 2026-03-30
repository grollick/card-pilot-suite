import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: any;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, mode } = body;
    // mode: "chat" | "leads" | "optimize" | "respond"

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch provider's business context
    const { data: business } = await supabase
      .from("businesses")
      .select("id, business_name, description, location_city, location_region, slug")
      .eq("owner_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const businessName = business?.business_name || "your business";
    const city = business?.location_city || "";
    const businessId = business?.id;

    // Fetch recent context in parallel
    const [servicesRes, leadsRes, reviewsRes, metricsRes] = await Promise.all([
      businessId
        ? supabase.from("services").select("title, price_amount, price_type").eq("business_id", businessId).eq("is_active", true).limit(10)
        : Promise.resolve({ data: [] }),
      businessId
        ? supabase.from("business_leads").select("full_name, message, source, status, created_at").eq("business_id", businessId).order("created_at", { ascending: false }).limit(10)
        : Promise.resolve({ data: [] }),
      businessId
        ? supabase.from("business_reviews").select("rating, review_text, reviewer_name, created_at").eq("business_id", businessId).eq("is_approved", true).order("created_at", { ascending: false }).limit(10)
        : Promise.resolve({ data: [] }),
      businessId
        ? supabase.from("marketplace_metrics").select("avg_rating, review_count, lead_count_30d, booking_count_30d, profile_views_30d, marketplace_score").eq("business_id", businessId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const services = servicesRes.data || [];
    const leads = leadsRes.data || [];
    const reviews = reviewsRes.data || [];
    const metrics = metricsRes.data;

    const contextBlock = `
BUSINESS CONTEXT:
- Name: ${businessName}
- Location: ${city}${business?.location_region ? `, ${business.location_region}` : ""}
- Services: ${services.length > 0 ? services.map((s: any) => `${s.title} (${s.price_type === "fixed" ? `$${s.price_amount}` : s.price_type})`).join(", ") : "None listed yet"}
- Recent leads (${leads.length}): ${leads.slice(0, 5).map((l: any) => `${l.full_name} - ${l.status || "new"} - "${(l.message || "").slice(0, 60)}"`).join("; ") || "None yet"}
- Reviews: ${reviews.length > 0 ? `${reviews.length} reviews, avg ${(reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)} stars` : "No reviews yet"}
- Performance (30d): ${metrics ? `${metrics.profile_views_30d || 0} views, ${metrics.lead_count_30d || 0} leads, ${metrics.booking_count_30d || 0} bookings, score: ${metrics.marketplace_score || 0}` : "No data yet"}
`;

    const actionInstructions = `
IMPORTANT: When your response contains actionable content, add hidden action tags at the END. Available:
- <!--ACTION:draft_reply:Send this reply--> — when you draft a reply to a lead
- <!--ACTION:copy:Copy to clipboard--> — for templates, messages, descriptions
- <!--ACTION:optimize_bio:Update my description--> — when you write a business description
- <!--ACTION:create_task:Create tasks from this--> — when you list action steps
Include only relevant tags. Never explain these tags.`;

    const systemPrompts: Record<string, string> = {
      chat: `You are an AI business growth assistant for ${businessName}, a service provider on guzzl.pro marketplace in ${city}. Help them grow their business, get more leads, improve their profile, and convert more customers. Be specific and actionable. Use the business context below to personalize advice.
${contextBlock}
${actionInstructions}`,

      leads: `You are a lead conversion specialist for ${businessName}. Help the provider respond to leads, follow up effectively, and close more deals. Draft professional, friendly messages. Suggest follow-up strategies based on lead status.
${contextBlock}
${actionInstructions}`,

      optimize: `You are a marketplace optimization expert for ${businessName}. Analyze their profile, services, reviews, and metrics. Give specific, prioritized recommendations to improve their marketplace ranking, get more reviews, and attract more customers.
${contextBlock}
${actionInstructions}`,

      respond: `You are a customer communication specialist for ${businessName}. Help draft professional responses to reviews, lead inquiries, and booking confirmations. Keep messages warm, professional, and on-brand.
${contextBlock}
${actionInstructions}`,
    };

    const systemPrompt = systemPrompts[mode] || systemPrompts.chat;

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
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("provider-assistant error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
