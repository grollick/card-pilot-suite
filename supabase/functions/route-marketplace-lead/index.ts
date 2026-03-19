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
    const { quoteRequestId } = await req.json();

    if (!quoteRequestId) {
      return new Response(JSON.stringify({ error: "Missing quoteRequestId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch the quote request
    const { data: quoteReq, error: qErr } = await supabase
      .from("marketplace_quote_requests")
      .select("*")
      .eq("id", quoteRequestId)
      .single();

    if (qErr || !quoteReq) {
      return new Response(JSON.stringify({ error: "Quote request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Find matching businesses (up to 3)
    // Query marketplace-enabled profiles matching profession/location
    let query = supabase
      .from("profiles")
      .select("id, name, handle, email, city, available_for_work, avg_response_minutes, professions(name)")
      .not("handle", "is", null)
      .not("name", "is", null)
      .eq("marketplace_enabled", true)
      .order("avg_response_minutes", { ascending: true, nullsFirst: false });

    const { data: candidates, error: cErr } = await query;

    if (cErr) throw cErr;

    // Score and filter candidates
    const scored = (candidates ?? []).map((c: any) => {
      let score = 0;

      // Profession match
      if (quoteReq.profession && c.professions?.name) {
        const profMatch = c.professions.name.toLowerCase().includes(
          quoteReq.profession.toLowerCase().replace(/-/g, " ")
        );
        if (profMatch) score += 50;
      }

      // Location match
      if (quoteReq.location && c.city) {
        const locMatch = c.city.toLowerCase().includes(
          quoteReq.location.toLowerCase().replace(/-/g, " ")
        );
        if (locMatch) score += 30;
      }

      // Availability boost
      if (c.available_for_work) score += 20;

      // Fast responder boost
      if (c.avg_response_minutes && c.avg_response_minutes < 60) score += 15;

      return { ...c, score };
    });

    // Sort by score descending, take top 3
    scored.sort((a: any, b: any) => b.score - a.score);
    const topMatches = scored.slice(0, 3).filter((m: any) => m.score > 0);

    // If no matches with score > 0, fall back to top 3 available
    const finalMatches = topMatches.length > 0
      ? topMatches
      : scored.filter((c: any) => c.available_for_work).slice(0, 3);

    // 3. Create leads and routing logs for each match
    let matched = 0;

    for (const business of finalMatches) {
      // Capture the lead for this business
      const { data: leadResult } = await supabase.rpc("capture_lead", {
        p_owner_id: business.id,
        p_name: quoteReq.customer_name,
        p_email: quoteReq.customer_email || null,
        p_phone: quoteReq.customer_phone || null,
        p_source: "marketplace",
        p_activity_type: "quote_requested",
        p_activity_title: `Marketplace quote request: ${quoteReq.service_needed || "General inquiry"}`,
        p_activity_description: [
          quoteReq.budget ? `Budget: ${quoteReq.budget}` : null,
          quoteReq.timeline ? `Timeline: ${quoteReq.timeline}` : null,
          quoteReq.notes ? `Notes: ${quoteReq.notes}` : null,
        ].filter(Boolean).join(" | "),
        p_meta_json: {
          quote_request_id: quoteRequestId,
          service_needed: quoteReq.service_needed,
          budget: quoteReq.budget,
          timeline: quoteReq.timeline,
          source_type: "marketplace_routing",
        },
        p_handle: business.handle || null,
      });

      const leadId = leadResult?.lead_id || null;

      // Insert routing log
      await supabase.from("lead_routing_log").insert({
        quote_request_id: quoteRequestId,
        user_id: business.id,
        lead_id: leadId,
        status: "delivered",
        delivered_at: new Date().toISOString(),
      });

      // Send email notification via send-email edge function
      if (business.email) {
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: business.email,
              subject: `🔔 New lead: ${quoteReq.customer_name} needs ${quoteReq.service_needed || "your services"}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #1a1a1a;">New Lead from CardPilot Marketplace</h2>
                  <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 16px 0;">
                    <p><strong>Name:</strong> ${quoteReq.customer_name}</p>
                    ${quoteReq.customer_email ? `<p><strong>Email:</strong> ${quoteReq.customer_email}</p>` : ""}
                    ${quoteReq.customer_phone ? `<p><strong>Phone:</strong> ${quoteReq.customer_phone}</p>` : ""}
                    ${quoteReq.service_needed ? `<p><strong>Service:</strong> ${quoteReq.service_needed}</p>` : ""}
                    ${quoteReq.budget ? `<p><strong>Budget:</strong> ${quoteReq.budget}</p>` : ""}
                    ${quoteReq.timeline ? `<p><strong>Timeline:</strong> ${quoteReq.timeline}</p>` : ""}
                    ${quoteReq.notes ? `<p><strong>Details:</strong> ${quoteReq.notes}</p>` : ""}
                  </div>
                  <p style="color: #666;">Respond quickly — leads who hear back within 1 hour are 7x more likely to convert.</p>
                  <p><a href="https://card-pilot-suite.lovable.app/app/contacts" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">View in Dashboard</a></p>
                </div>
              `,
            },
          });
        } catch (emailErr) {
          console.error("Email notification failed for", business.id, emailErr);
        }
      }

      // Log dashboard notification as activity
      if (leadId) {
        await supabase.from("contact_activities").insert({
          user_id: business.id,
          lead_id: leadId,
          activity_type: "notification",
          title: `🔔 New marketplace lead: ${quoteReq.customer_name}`,
          description: `Service: ${quoteReq.service_needed || "General"} | Budget: ${quoteReq.budget || "Not specified"} | Timeline: ${quoteReq.timeline || "Flexible"}`,
          occurred_at: new Date().toISOString(),
        });
      }

      matched++;
    }

    return new Response(JSON.stringify({ matched, quoteRequestId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("route-marketplace-lead error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
