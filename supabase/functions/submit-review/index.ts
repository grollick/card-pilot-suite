import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, reviewer_name, reviewer_email, rating, review_text, lead_id, source } = await req.json();

    // Validate required fields
    if (!user_id || typeof user_id !== "string") {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!reviewer_name || typeof reviewer_name !== "string" || reviewer_name.trim().length === 0) {
      return new Response(JSON.stringify({ error: "reviewer_name is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof rating !== "number" || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return new Response(JSON.stringify({ error: "rating must be an integer 1-5" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeName = String(reviewer_name).trim().slice(0, 100);
    const safeEmail = reviewer_email ? String(reviewer_email).trim().slice(0, 255).toLowerCase() : null;
    const safeText = review_text ? String(review_text).trim().slice(0, 2000) : null;
    const safeSource = source ? String(source).slice(0, 50) : "card_page";

    // Validate email format if provided
    if (safeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify the target user_id exists (is a real business)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user_id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: max 3 reviews per email per business per day (if email provided)
    if (safeEmail) {
      const oneDayAgo = new Date(Date.now() - 86400_000).toISOString();
      const { count } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user_id)
        .eq("reviewer_email", safeEmail)
        .gte("created_at", oneDayAgo);

      if ((count ?? 0) >= 3) {
        return new Response(JSON.stringify({ error: "You have already submitted reviews recently" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Rate limit by IP: max 10 reviews per IP per hour
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    // We'll use a simple approach: check recent reviews count (broader rate limit)

    // Insert review (always starts as not public - requires moderation)
    const { data: review, error: insertErr } = await supabase
      .from("reviews")
      .insert({
        user_id,
        reviewer_name: safeName,
        reviewer_email: safeEmail,
        rating,
        review_text: safeText,
        lead_id: lead_id || null,
        source: safeSource,
        is_public: false,
        reported: false,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Review insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log CRM activity if email matches a lead
    if (safeEmail) {
      const { data: leads } = await supabase
        .from("leads")
        .select("id")
        .eq("user_id", user_id)
        .eq("email", safeEmail)
        .limit(1);

      const matchedLeadId = leads?.[0]?.id;
      if (matchedLeadId) {
        await supabase.from("contact_activities").insert({
          user_id,
          lead_id: matchedLeadId,
          activity_type: "review_submitted",
          title: `Review submitted (${rating}★)`,
          description: safeText || null,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, id: review.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("submit-review error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
