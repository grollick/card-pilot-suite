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
    const body = await req.json();
    const {
      handle,
      service_id,
      customer_name,
      customer_email,
      customer_phone,
      notes,
      start_datetime,
      end_datetime,
    } = body;

    // ── Input validation ──
    if (!handle || typeof handle !== "string" || handle.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid handle" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!customer_name || typeof customer_name !== "string" || customer_name.length > 200) {
      return new Response(JSON.stringify({ error: "customer_name is required (max 200 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!start_datetime || !end_datetime) {
      return new Response(JSON.stringify({ error: "start_datetime and end_datetime are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Validate dates
    const startDt = new Date(start_datetime);
    const endDt = new Date(end_datetime);
    if (isNaN(startDt.getTime()) || isNaN(endDt.getTime()) || endDt <= startDt) {
      return new Response(JSON.stringify({ error: "Invalid date range" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Don't allow bookings in the distant past
    if (startDt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      return new Response(JSON.stringify({ error: "Cannot book in the past" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (customer_email && (typeof customer_email !== "string" || customer_email.length > 255)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (customer_phone && (typeof customer_phone !== "string" || customer_phone.length > 50)) {
      return new Response(JSON.stringify({ error: "Invalid phone" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (notes && (typeof notes !== "string" || notes.length > 2000)) {
      return new Response(JSON.stringify({ error: "Notes too long (max 2000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Resolve handle → user_id server-side (never trust client) ──
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", handle.toLowerCase().trim())
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = profile.id;

    // ── Validate service_id belongs to this user (if provided) ──
    if (service_id) {
      const { data: svc } = await supabase
        .from("booking_services")
        .select("id")
        .eq("id", service_id)
        .eq("user_id", userId)
        .eq("active", true)
        .single();

      if (!svc) {
        return new Response(JSON.stringify({ error: "Invalid service" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Create booking ──
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        service_id: service_id || null,
        customer_name: customer_name.trim(),
        customer_email: customer_email?.trim() || null,
        customer_phone: customer_phone?.trim() || null,
        notes: notes?.trim() || null,
        start_datetime: startDt.toISOString(),
        end_datetime: endDt.toISOString(),
        status: "requested",
      })
      .select("id, start_datetime, end_datetime")
      .single();

    if (bookingError) {
      console.error("Booking insert error:", bookingError);
      return new Response(JSON.stringify({ error: "Failed to create booking" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: booking }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-booking error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
