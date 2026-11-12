import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { notifyLeadOwner } from "./lead-notification.ts";
import { formatBookingTimes, queueCustomerEmail, validTimezone } from "./booking-email.ts";

const StatusSchema = z.object({
  action: z.literal("update_status"),
  bookingId: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show", "requested"]),
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Run email work after the response is sent; a failed email never fails the booking or lead.
function runInBackground(tasks: Array<() => Promise<unknown>>) {
  const work = Promise.allSettled(tasks.map((t) => t())).then((results) => {
    for (const r of results) if (r.status === "rejected") console.error("Background email task failed:", r.reason);
  });
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(work);
  return work;
}

const LeadSchema = z.object({
  action: z.literal("capture_lead"),
  ownerId: z.string().uuid(),
  handle: z.string().max(100).nullish(),
  name: z.string().trim().min(1).max(200),
  email: z.string().email().max(255).nullish(),
  phone: z.string().max(50).nullish(),
  source: z.enum(["card_form", "business_card", "marketplace", "manual", "booking"]).default("card_form"),
  activityType: z.enum(["form_submitted", "quote_requested", "card_scanned"]).default("form_submitted"),
  activityTitle: z.string().max(300).default("Contact form submitted"),
  activityDescription: z.string().max(10000).nullish(),
  metaJson: z.record(z.unknown()).default({}),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    if (body?.action === "update_status") {
      const parsed = StatusSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Invalid request" }, 400);
      const url = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!url || !serviceKey) throw new Error("Missing server configuration");
      const client = createClient(url, serviceKey);
      const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      const { data: authData } = token ? await client.auth.getUser(token) : { data: { user: null } };
      const user = authData?.user;
      if (!user) return json({ error: "Please sign in again." }, 401);

      const { bookingId, status } = parsed.data;
      const { data: booking } = await client.from("bookings")
        .select("id,user_id,customer_name,customer_email,start_datetime,end_datetime,timezone,service_id,booking_services(name)")
        .eq("id", bookingId).maybeSingle();
      if (!booking || booking.user_id !== user.id) return json({ error: "Booking not found" }, 404);

      const { error: updErr } = await client.from("bookings").update({ status }).eq("id", bookingId);
      if (updErr) {
        console.error("Booking status update failed", { bookingId, error: updErr.message });
        return json({ error: "Couldn't update the booking." }, 400);
      }

      const templateName = status === "confirmed" ? "booking-confirmed"
        : status === "cancelled" ? "booking-cancelled"
        : status === "completed" ? "review-request" : null;
      const email = booking.customer_email?.trim() || null;
      let emailQueued = false;
      if (templateName && email) {
        const { data: provider } = await client.from("profiles").select("name,company,handle").eq("id", user.id).single();
        const { date, shortDate, time } = formatBookingTimes(booking.start_datetime, booking.end_datetime, booking.timezone);
        emailQueued = await queueCustomerEmail(client, bookingId, templateName, email, `${templateName}-${bookingId}`, {
          customerName: booking.customer_name?.trim().split(" ")[0],
          serviceName: (booking.booking_services as any)?.name || "",
          date, shortDate, time,
          providerName: provider?.company || provider?.name || "",
          handle: provider?.handle || "",
        });
      }
      return json({ success: true, status, emailAttempted: Boolean(templateName), hasEmail: Boolean(email), emailQueued, customerEmail: email });
    }
    if (body.action === "capture_lead") {
      const parsed = LeadSchema.safeParse(body);
      if (!parsed.success) return new Response(JSON.stringify({ error: "Please check your contact details." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      const input = parsed.data;
      const url = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!url || !serviceKey) throw new Error("Missing server configuration");
      const client = createClient(url, serviceKey);
      // Resolve the destination independently; callers cannot choose the email recipient.
      const { data: owner } = await client.from("profiles").select("id,handle").eq("id", input.ownerId).single();
      if (!owner || (input.handle && input.handle !== owner.handle)) return new Response(JSON.stringify({ error: "Card not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      const { data: result, error } = await client.rpc("capture_lead", {
        p_owner_id: owner.id, p_name: input.name, p_email: input.email || null, p_phone: input.phone || null,
        p_source: input.source, p_activity_type: input.activityType, p_activity_title: input.activityTitle,
        p_activity_description: input.activityDescription || null, p_meta_json: input.metaJson, p_handle: owner.handle,
      });
      if (error || !result?.lead_id) return new Response(JSON.stringify({ error: "We couldn't save your message. Please try again." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      const bg = runInBackground([() => notifyLeadOwner(client, result.lead_id, crypto.randomUUID(), input.activityTitle, input.activityDescription)]);
      if (!(globalThis as any).EdgeRuntime?.waitUntil) await bg;
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const {
      handle,
      service_id,
      customer_name,
      customer_email,
      customer_phone,
      notes,
      start_datetime,
      end_datetime,
      timezone,
    } = body;
    const bookingTimezone = validTimezone(timezone);

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

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) throw new Error("Missing server configuration");
    const supabase = createClient(url, serviceKey);

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

    // ── Refuse overlapping times ──
    const { data: clash, error: clashErr } = await supabase
      .from("bookings")
      .select("id")
      .eq("user_id", userId)
      .in("status", ["requested", "pending", "confirmed"])
      .lt("start_datetime", endDt.toISOString())
      .gt("end_datetime", startDt.toISOString())
      .limit(1);
    if (clashErr) throw clashErr;
    if (clash && clash.length > 0) {
      return json({ error: "That time was just taken. Please pick another time." }, 409);
    }

    // ── Create booking ──
    const bookingId = crypto.randomUUID();
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        id: bookingId,
        user_id: userId,
        service_id: service_id || null,
        customer_name: customer_name.trim(),
        customer_email: customer_email?.trim() || null,
        customer_phone: customer_phone?.trim() || null,
        notes: notes?.trim() || null,
        start_datetime: startDt.toISOString(),
        end_datetime: endDt.toISOString(),
        status: "requested",
        timezone: bookingTimezone,
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

    const notifyOwner = async () => {
      const { data: linkedBooking } = await supabase.from("bookings").select("lead_id").eq("id", bookingId).single();
      if (linkedBooking?.lead_id) await notifyLeadOwner(supabase, linkedBooking.lead_id, bookingId, "New booking request", notes || null);
    };
    const sendCustomerEmail = async () => {
      if (!customer_email) return;
      try {
        // Fetch provider name and service name for the email
        const { data: providerProfile } = await supabase
          .from("profiles")
          .select("name, company, handle")
          .eq("id", userId)
          .single();

        let serviceName = "";
        if (service_id) {
          const { data: svcData } = await supabase
            .from("booking_services")
            .select("name")
            .eq("id", service_id)
            .single();
          serviceName = svcData?.name || "";
        }

        const providerName = providerProfile?.company || providerProfile?.name || "";

        const { date, time } = formatBookingTimes(startDt, endDt, bookingTimezone);
        await queueCustomerEmail(supabase, bookingId, "booking-confirmation", customer_email.trim(), `booking-confirm-${bookingId}`, {
          customerName: customer_name.trim().split(" ")[0],
          serviceName,
          date,
          time,
          providerName,
          handle: providerProfile?.handle || handle,
        });
      } catch (emailErr) {
        // Non-fatal — booking was already created
        console.error("Failed to send booking confirmation email:", emailErr);
      }
    };
    const bg = runInBackground([notifyOwner, sendCustomerEmail]);
    if (!(globalThis as any).EdgeRuntime?.waitUntil) await bg;

    return new Response(JSON.stringify({ success: true, data: booking }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-booking error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: err instanceof SyntaxError ? 400 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
