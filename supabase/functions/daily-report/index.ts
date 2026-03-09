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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find users with daily reports enabled
    const { data: users } = await supabase
      .from("profiles")
      .select("id, name, email, handle")
      .eq("daily_report_enabled", true)
      .not("email", "is", null);

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    let sent = 0;

    for (const user of users) {
      try {
        const [
          { data: events },
          { count: newLeads },
          { count: newBookings },
          { data: services },
        ] = await Promise.all([
          supabase.from("analytics_events").select("event_type")
            .eq("user_id", user.id)
            .gte("created_at", yesterdayStart.toISOString())
            .lte("created_at", yesterdayEnd.toISOString()),
          supabase.from("leads").select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("created_at", yesterdayStart.toISOString())
            .lte("created_at", yesterdayEnd.toISOString()),
          supabase.from("bookings").select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("created_at", yesterdayStart.toISOString())
            .lte("created_at", yesterdayEnd.toISOString()),
          supabase.from("booking_services").select("price")
            .eq("user_id", user.id)
            .eq("active", true),
        ]);

        const allEvents = events ?? [];
        const views = allEvents.filter(e => e.event_type === "card_view").length;
        const clicks = allEvents.filter(e => e.event_type === "button_click").length;
        const leads = newLeads ?? 0;
        const bookings = newBookings ?? 0;

        const avgPrice = (services ?? []).length > 0
          ? (services ?? []).reduce((s, sv) => s + (Number(sv.price) || 0), 0) / (services ?? []).length
          : 50;
        const estimatedRevenue = Math.round(bookings * avgPrice);

        const dateStr = yesterdayStart.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

        // Send via existing send-email function
        await supabase.functions.invoke("send-email", {
          body: {
            to: user.email,
            subject: `📊 Daily Report: ${views} views, ${leads} leads, $${estimatedRevenue} est. revenue`,
            html: `
              <div style="font-family:'DM Sans',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;">
                <h1 style="color:#1a1a2e;font-size:22px;margin:0 0 4px;">Daily Business Report</h1>
                <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">${dateStr}</p>
                
                <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
                  <tr>
                    <td style="padding:16px;text-align:center;background:#f8f9fc;border-radius:12px 0 0 0;">
                      <div style="font-size:28px;font-weight:700;color:#1a1a2e;">${views}</div>
                      <div style="font-size:12px;color:#6b7280;margin-top:4px;">Card Views</div>
                    </td>
                    <td style="padding:16px;text-align:center;background:#f8f9fc;">
                      <div style="font-size:28px;font-weight:700;color:#1a1a2e;">${leads}</div>
                      <div style="font-size:12px;color:#6b7280;margin-top:4px;">New Leads</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px;text-align:center;background:#f8f9fc;border-radius:0 0 0 12px;">
                      <div style="font-size:28px;font-weight:700;color:#1a1a2e;">${bookings}</div>
                      <div style="font-size:12px;color:#6b7280;margin-top:4px;">Bookings</div>
                    </td>
                    <td style="padding:16px;text-align:center;background:#f8f9fc;border-radius:0 0 12px 0;">
                      <div style="font-size:28px;font-weight:700;color:#22c55e;">$${estimatedRevenue}</div>
                      <div style="font-size:12px;color:#6b7280;margin-top:4px;">Est. Revenue</div>
                    </td>
                  </tr>
                </table>

                <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "#"}/app" 
                   style="display:block;text-align:center;padding:12px 24px;background:#4361ee;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                  Open Dashboard
                </a>

                <p style="color:#9ca3af;font-size:11px;text-align:center;margin:24px 0 0;">
                  CardPilot — Your digital business card platform<br/>
                  <a href="#" style="color:#9ca3af;">Unsubscribe from daily reports</a>
                </p>
              </div>
            `,
            email_type: "custom",
          },
        });

        sent++;
      } catch (userErr) {
        console.error(`Failed to send report for user ${user.id}:`, userErr);
      }
    }

    return new Response(JSON.stringify({ sent, total: users.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("daily-report error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
