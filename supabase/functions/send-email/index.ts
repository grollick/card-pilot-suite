import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  reply_to?: string;
  /** Optional email type for logging: booking_confirmation | follow_up | campaign | custom */
  email_type?: string;
  /** Optional lead_id to log activity against */
  lead_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const body: EmailRequest = await req.json();
    const { to, subject, html, from, reply_to, email_type, lead_id } = body;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from ?? "CardPilot <onboarding@resend.dev>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html + getMarketplaceSignature(),
        ...(reply_to ? { reply_to } : {}),
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend API error:", resendData);
      throw new Error(
        `Resend API error [${resendRes.status}]: ${JSON.stringify(resendData)}`
      );
    }

    // Optionally log activity if lead_id is provided
    if (lead_id) {
      const authHeader = req.headers.get("authorization");
      if (authHeader) {
        const { createClient } = await import(
          "https://esm.sh/@supabase/supabase-js@2"
        );
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Decode JWT to get user_id
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);

        if (user) {
          await supabase.from("contact_activities").insert({
            user_id: user.id,
            lead_id,
            activity_type: "email",
            title: `Email sent: ${subject}`,
            description: `Type: ${email_type ?? "custom"} | To: ${Array.isArray(to) ? to.join(", ") : to}`,
            occurred_at: new Date().toISOString(),
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-email error:", err);

    // Log to system_events
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await svc.from("system_events").insert({
        event_type: "email_failure",
        severity: "error",
        message: err.message ?? "Email send failed",
        meta_data: { function: "send-email" },
      });
    } catch (_) { /* best effort */ }

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
