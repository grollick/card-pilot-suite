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

    const { action, context } = body;
    // action: "insights" | "lead_reply" | "follow_up" | "booking_confirm" | "review_request" | "profile_optimize"

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get provider's business
    const { data: business } = await supabase
      .from("businesses")
      .select("id, business_name, description, location_city, location_region, slug, logo_url, phone, email, website, cover_image_url")
      .eq("owner_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const businessId = business?.id;
    const businessName = business?.business_name || "your business";

    // Fetch context based on action
    let contextData: any = {};

    if (businessId) {
      const [servicesRes, leadsRes, reviewsRes, bookingsRes, metricsRes, profileRes] = await Promise.all([
        supabase.from("services").select("title, price_amount, price_type, description").eq("business_id", businessId).eq("is_active", true).limit(15),
        supabase.from("business_leads").select("id, full_name, email, phone, message, source, status, created_at").eq("business_id", businessId).order("created_at", { ascending: false }).limit(20),
        supabase.from("business_reviews").select("id, rating, review_text, reviewer_name, created_at, is_approved").eq("business_id", businessId).order("created_at", { ascending: false }).limit(15),
        supabase.from("business_bookings").select("id, customer_name, customer_email, booking_date, booking_time, status, notes, created_at").eq("business_id", businessId).order("created_at", { ascending: false }).limit(15),
        supabase.from("marketplace_metrics").select("*").eq("business_id", businessId).maybeSingle(),
        supabase.from("business_profiles").select("*").eq("business_id", businessId).maybeSingle(),
      ]);

      contextData = {
        services: servicesRes.data || [],
        leads: leadsRes.data || [],
        reviews: reviewsRes.data || [],
        bookings: bookingsRes.data || [],
        metrics: metricsRes.data,
        profile: profileRes.data,
        business,
      };
    }

    // Build prompt based on action
    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "insights": {
        const leads = contextData.leads || [];
        const bookings = contextData.bookings || [];
        const reviews = contextData.reviews || [];
        const newLeads = leads.filter((l: any) => l.status === "new" || !l.status);
        const pendingBookings = bookings.filter((b: any) => b.status === "pending");
        const completedNoReview = bookings.filter((b: any) => b.status === "completed");

        systemPrompt = `You are a practical business assistant for ${businessName}. Analyze the provider's current data and return a JSON array of actionable suggestions. Each suggestion must have: type (lead_reply|follow_up|review_request|profile_improve|booking_confirm), title (short, max 50 chars), description (1-2 sentences, practical), priority (high|medium|low), leadId or bookingId if applicable. Max 5 suggestions, sorted by priority. Only include relevant suggestions based on actual data.`;

        userPrompt = `Current data:
- ${newLeads.length} new/unresponded leads${newLeads.length > 0 ? `: ${newLeads.slice(0, 3).map((l: any) => `${l.full_name} - "${(l.message || "").slice(0, 80)}"`).join("; ")}` : ""}
- ${pendingBookings.length} pending bookings${pendingBookings.length > 0 ? `: ${pendingBookings.slice(0, 3).map((b: any) => `${b.customer_name} on ${b.booking_date}`).join("; ")}` : ""}
- ${completedNoReview.length} completed bookings (check if review was requested)
- ${reviews.length} total reviews, avg rating: ${reviews.length > 0 ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1) : "N/A"}
- Profile: ${business?.description ? "has description" : "MISSING description"}, ${business?.logo_url ? "has logo" : "MISSING logo"}, ${business?.cover_image_url ? "has cover" : "MISSING cover"}, ${business?.phone ? "has phone" : "MISSING phone"}
- Services listed: ${contextData.services?.length || 0}

Generate actionable suggestions as a JSON array.`;
        break;
      }

      case "lead_reply": {
        const lead = context?.lead;
        systemPrompt = `You are a helpful assistant for ${businessName}, a service provider. Generate a professional, friendly reply to a customer lead inquiry. Keep it concise (3-5 sentences), warm, and action-oriented. Include a call to action (suggest booking or call). Return JSON: { reply: string, summary: string, missingInfo: string[], suggestedAction: string }`;
        userPrompt = `Lead details:
- Name: ${lead?.full_name || "Unknown"}
- Message: "${lead?.message || "No message provided"}"
- Email: ${lead?.email || "Not provided"}
- Phone: ${lead?.phone || "Not provided"}
- Source: ${lead?.source || "marketplace"}
- Services we offer: ${contextData.services?.map((s: any) => s.title).join(", ") || "Various services"}`;
        break;
      }

      case "follow_up": {
        const lead = context?.lead;
        systemPrompt = `You are a follow-up specialist for ${businessName}. Generate a friendly, non-pushy follow-up message for a lead that hasn't been contacted or booked yet. Keep it short (2-4 sentences). Return JSON: { message: string, subject: string }`;
        userPrompt = `Lead: ${lead?.full_name || "Customer"}, original message: "${lead?.message || ""}", received: ${lead?.created_at || "recently"}`;
        break;
      }

      case "booking_confirm": {
        const booking = context?.booking;
        systemPrompt = `You are a booking assistant for ${businessName}. Generate a professional booking confirmation/reminder message. Keep it warm and clear. Return JSON: { confirmation: string, reminder: string }`;
        userPrompt = `Booking: ${booking?.customer_name || "Customer"} on ${booking?.booking_date || "TBD"} at ${booking?.booking_time || "TBD"}. Notes: ${booking?.notes || "None"}`;
        break;
      }

      case "review_request": {
        const booking = context?.booking;
        systemPrompt = `You are a review request specialist for ${businessName}. Generate a short, friendly review request message. Keep it personal and easy to respond to. Return JSON: { message: string }`;
        userPrompt = `Customer: ${booking?.customer_name || "Customer"}, service date: ${booking?.booking_date || "recently"}.`;
        break;
      }

      case "profile_optimize": {
        systemPrompt = `You are a marketplace optimization expert. Analyze this service provider's profile and give specific suggestions to improve conversion. Return JSON array of suggestions, each with: field (headline|description|services|logo|cover|phone|email|website), suggestion (string), reason (string), priority (high|medium|low). Max 5 suggestions.`;
        userPrompt = `Business: ${businessName}
Location: ${business?.location_city || "Unknown"}
Description: ${business?.description || "MISSING"}
Logo: ${business?.logo_url ? "Yes" : "No"}
Cover: ${business?.cover_image_url ? "Yes" : "No"}
Phone: ${business?.phone || "MISSING"}
Email: ${business?.email || "MISSING"}  
Website: ${business?.website || "MISSING"}
Profile headline: ${contextData.profile?.headline || "MISSING"}
Profile bio: ${contextData.profile?.bio || "MISSING"}
Services: ${contextData.services?.length || 0} listed
Reviews: ${contextData.reviews?.length || 0} (avg: ${contextData.reviews?.length > 0 ? (contextData.reviews.reduce((s: number, r: any) => s + r.rating, 0) / contextData.reviews.length).toFixed(1) : "N/A"})`;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

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
        tools: [{
          type: "function",
          function: {
            name: "return_result",
            description: "Return the structured result",
            parameters: {
              type: "object",
              properties: {
                result: { type: "object", description: "The structured result matching the requested format" },
              },
              required: ["result"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_result" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    
    // Extract tool call result
    let result: any = null;
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const args = JSON.parse(toolCall.function.arguments);
        result = args.result;
      }
    } catch (e) {
      // Fallback: try to parse content as JSON
      try {
        const content = aiData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        if (jsonMatch) result = JSON.parse(jsonMatch[0]);
      } catch {}
    }

    if (!result) {
      result = action === "insights" || action === "profile_optimize" ? [] : { error: "Could not generate suggestions" };
    }

    return new Response(JSON.stringify({ result, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("provider-insights error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
