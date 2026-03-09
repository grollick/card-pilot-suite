import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id } = await req.json();
    if (!booking_id) {
      return new Response(JSON.stringify({ error: "booking_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch the booking with service info
    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .select("id, customer_name, customer_email, user_id, service_id, booking_services(name)")
      .eq("id", booking_id)
      .single();

    if (bErr || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!booking.customer_email) {
      return new Response(JSON.stringify({ skipped: true, reason: "No customer email" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the card owner's profile for branding
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, handle, company")
      .eq("id", booking.user_id)
      .single();

    const ownerName = profile?.company || profile?.name || "Us";
    const handle = profile?.handle;
    const serviceName = (booking as any).booking_services?.name || "your appointment";
    const reviewUrl = handle
      ? `${supabaseUrl.replace(".supabase.co", ".lovable.app")}/${handle}?review=1`
      : "#";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:40px 24px">
  <h1 style="font-size:22px;font-weight:700;color:#1a1a2e;margin:0 0 8px">Thanks for choosing ${ownerName}!</h1>
  <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px">
    Hi ${booking.customer_name},<br><br>
    We hope you enjoyed your ${serviceName}. Your feedback means the world to us and helps other customers find great service.
  </p>
  <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px">
    Would you mind taking a moment to leave a quick review?
  </p>
  <div style="text-align:center;margin:32px 0">
    <a href="${reviewUrl}" style="display:inline-block;background:#4361ee;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600">
      Leave a Review ⭐
    </a>
  </div>
  <p style="font-size:13px;color:#999;margin:24px 0 0">
    Thank you for your support!<br>— ${ownerName}
  </p>
</div>
</body>
</html>`;

    // Send via the existing send-email function
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CardPilot <onboarding@resend.dev>",
        to: [booking.customer_email],
        subject: `How was your ${serviceName}? We'd love your feedback!`,
        html,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      return new Response(JSON.stringify({ error: "Failed to send email", detail: resendData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log activity if there's a linked lead
    if (booking.lead_id) {
      await supabase.from("contact_activities").insert({
        user_id: booking.user_id,
        lead_id: booking.lead_id,
        activity_type: "email",
        title: "Review request sent",
        description: `Automatic review request sent after ${serviceName} was completed.`,
      });
    }

    return new Response(JSON.stringify({ success: true, email_id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
