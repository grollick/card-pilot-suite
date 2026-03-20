import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // ── Auth check: require authenticated user or service_role ──
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      // Also allow service_role tokens (used by other edge functions)
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (token !== serviceRoleKey) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const userId = claimsData?.claims?.sub;

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
        from: from ?? "guzzl.pro <onboarding@resend.dev>",
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
    if (lead_id && userId) {
      const svcClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

      await svcClient.from("contact_activities").insert({
        user_id: userId,
        lead_id,
        activity_type: "email",
        title: `Email sent: ${subject}`,
        description: `Type: ${email_type ?? "custom"} | To: ${Array.isArray(to) ? to.join(", ") : to}`,
        occurred_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-email error:", err);

    // Log to system_events
    try {
      const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await svc.from("system_events").insert({
        event_type: "email_failure",
        severity: "error",
        message: err.message ?? "Email send failed",
        meta_data: { function: "send-email" },
      });
    } catch (_) { /* best effort */ }

    return new Response(
      JSON.stringify({ error: "Email send failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getMarketplaceSignature(): string {
  return `
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="font-size:11px;color:#9ca3af;margin:0;">
        Sent via <a href="https://guzzl.pro" style="color:#4361ee;text-decoration:none;font-weight:600;">guzzl.pro</a>
      </p>
      <p style="font-size:10px;color:#b0b0b0;margin:4px 0 0;">
        <a href="https://guzzl.pro/discover" style="color:#6366f1;text-decoration:none;">
          Find trusted professionals on the guzzl.pro Marketplace →
        </a>
      </p>
    </div>
  `;
}
