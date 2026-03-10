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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let sent = 0;

    for (const user of users) {
      try {
        const firstName = (user.name || "").split(" ")[0] || "there";

        const [
          { data: events },
          { count: newLeads },
          { count: newBookings },
          { data: services },
          { count: estimatesSent },
          { count: jobsCompleted },
          { count: uncontactedLeads },
          { count: pendingEstimates },
          { count: todayBookings },
          { count: todayNewLeads },
          { count: openTasks },
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
          supabase.from("estimates").select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "sent")
            .gte("updated_at", yesterdayStart.toISOString())
            .lte("updated_at", yesterdayEnd.toISOString()),
          supabase.from("jobs").select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "completed")
            .gte("updated_at", yesterdayStart.toISOString())
            .lte("updated_at", yesterdayEnd.toISOString()),
          supabase.from("leads").select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "open")
            .is("last_activity_at", null),
          supabase.from("estimates").select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "sent"),
          // Today's forward-looking data
          supabase.from("bookings").select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("start_datetime", todayStart.toISOString())
            .lte("start_datetime", todayEnd.toISOString())
            .in("status", ["pending", "confirmed"]),
          supabase.from("leads").select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "open")
            .gte("created_at", todayStart.toISOString()),
          supabase.from("tasks").select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "open")
            .lte("due_date", todayEnd.toISOString().split("T")[0]),
        ]);

        const allEvents = events ?? [];
        const views = allEvents.filter(e => e.event_type === "card_view").length;
        const leads = newLeads ?? 0;
        const bookings = newBookings ?? 0;
        const estSent = estimatesSent ?? 0;
        const jobsDone = jobsCompleted ?? 0;

        const avgPrice = (services ?? []).length > 0
          ? (services ?? []).reduce((s, sv) => s + (Number(sv.price) || 0), 0) / (services ?? []).length
          : 50;
        const estimatedRevenue = Math.round(bookings * avgPrice);

        const dateStr = yesterdayStart.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

        // Morning summary items
        const morningItems: string[] = [];
        const tLeads = (todayNewLeads ?? 0) + (uncontactedLeads ?? 0);
        if (tLeads > 0) morningItems.push(`👤 <strong>${tLeads}</strong> lead${tLeads > 1 ? "s" : ""} need${tLeads === 1 ? "s" : ""} your attention`);
        if ((todayBookings ?? 0) > 0) morningItems.push(`📅 <strong>${todayBookings}</strong> booking${(todayBookings ?? 0) > 1 ? "s" : ""} scheduled today`);
        if ((pendingEstimates ?? 0) > 0) morningItems.push(`📋 <strong>${pendingEstimates}</strong> estimate${(pendingEstimates ?? 0) > 1 ? "s" : ""} awaiting approval`);
        if ((openTasks ?? 0) > 0) morningItems.push(`✅ <strong>${openTasks}</strong> task${(openTasks ?? 0) > 1 ? "s" : ""} due today`);

        const morningHtml = `
          <div style="margin:0 0 28px;padding:20px;background:linear-gradient(135deg,#eef2ff,#faf5ff);border-radius:16px;">
            <div style="font-size:20px;font-weight:700;color:#1a1a2e;margin:0 0 4px;">Good morning, ${firstName}! ☀️</div>
            <div style="font-size:13px;color:#6b7280;margin:0 0 16px;">Here's what's on your plate today.</div>
            ${morningItems.length > 0 ? `
              <div style="background:#ffffff;border-radius:12px;padding:14px 16px;">
                ${morningItems.map(item => `
                  <div style="font-size:14px;color:#1a1a2e;padding:6px 0;${morningItems.indexOf(item) < morningItems.length - 1 ? 'border-bottom:1px solid #f3f4f6;' : ''}">${item}</div>
                `).join("")}
              </div>
            ` : `
              <div style="background:#ffffff;border-radius:12px;padding:14px 16px;text-align:center;">
                <div style="font-size:14px;color:#22c55e;font-weight:600;">🎉 All clear! No urgent items today.</div>
                <div style="font-size:12px;color:#6b7280;margin-top:4px;">Great time to share your card or follow up with past clients.</div>
              </div>
            `}
          </div>
        `;

        // Action items
        const insightItems: string[] = [];
        if ((uncontactedLeads ?? 0) > 0) {
          insightItems.push(`📞 You have <strong>${uncontactedLeads}</strong> lead${(uncontactedLeads ?? 0) > 1 ? "s" : ""} that haven't been contacted.`);
        }
        if ((pendingEstimates ?? 0) > 0) {
          insightItems.push(`📋 <strong>${pendingEstimates}</strong> estimate${(pendingEstimates ?? 0) > 1 ? "s" : ""} sent but not yet approved.`);
        }

        const insightsHtml = insightItems.length > 0 ? `
          <div style="margin:0 0 24px;padding:16px;background:#fef9e7;border-radius:12px;">
            <div style="font-size:13px;font-weight:600;color:#92400e;margin:0 0 8px;">Action Items</div>
            ${insightItems.map(item => `<div style="font-size:13px;color:#78350f;margin:4px 0;">${item}</div>`).join("")}
          </div>
        ` : "";

        const appUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "#";

        await supabase.functions.invoke("send-email", {
          body: {
            to: user.email,
            subject: `☀️ Good morning, ${firstName}! ${tLeads > 0 ? `${tLeads} lead${tLeads > 1 ? "s" : ""} waiting` : (todayBookings ?? 0) > 0 ? `${todayBookings} booking${(todayBookings ?? 0) > 1 ? "s" : ""} today` : "Your daily update"}`,
            html: `
              <div style="font-family:'DM Sans',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;">
                ${morningHtml}

                <h2 style="color:#1a1a2e;font-size:16px;margin:0 0 4px;">Yesterday's Scorecard</h2>
                <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">${dateStr}</p>
                
                <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
                  <tr>
                    <td style="padding:14px;text-align:center;background:#f8f9fc;border-radius:12px 0 0 0;">
                      <div style="font-size:26px;font-weight:700;color:#1a1a2e;">${views}</div>
                      <div style="font-size:11px;color:#6b7280;margin-top:4px;">Card Views</div>
                    </td>
                    <td style="padding:14px;text-align:center;background:#f8f9fc;">
                      <div style="font-size:26px;font-weight:700;color:#1a1a2e;">${leads}</div>
                      <div style="font-size:11px;color:#6b7280;margin-top:4px;">New Leads</div>
                    </td>
                    <td style="padding:14px;text-align:center;background:#f8f9fc;border-radius:0 12px 0 0;">
                      <div style="font-size:26px;font-weight:700;color:#1a1a2e;">${bookings}</div>
                      <div style="font-size:11px;color:#6b7280;margin-top:4px;">Bookings</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px;text-align:center;background:#f8f9fc;border-radius:0 0 0 12px;">
                      <div style="font-size:26px;font-weight:700;color:#1a1a2e;">${estSent}</div>
                      <div style="font-size:11px;color:#6b7280;margin-top:4px;">Estimates Sent</div>
                    </td>
                    <td style="padding:14px;text-align:center;background:#f8f9fc;">
                      <div style="font-size:26px;font-weight:700;color:#1a1a2e;">${jobsDone}</div>
                      <div style="font-size:11px;color:#6b7280;margin-top:4px;">Jobs Done</div>
                    </td>
                    <td style="padding:14px;text-align:center;background:#f8f9fc;border-radius:0 0 12px 0;">
                      <div style="font-size:26px;font-weight:700;color:#22c55e;">$${estimatedRevenue}</div>
                      <div style="font-size:11px;color:#6b7280;margin-top:4px;">Est. Revenue</div>
                    </td>
                  </tr>
                </table>

                ${insightsHtml}

                <a href="${appUrl}/app" 
                   style="display:block;text-align:center;padding:14px 24px;background:linear-gradient(135deg,#4361ee,#7c3aed);color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">
                  Open Your Dashboard →
                </a>

                <p style="color:#9ca3af;font-size:11px;text-align:center;margin:24px 0 0;">
                  CardPilot — Your digital business card platform<br/>
                  <a href="${appUrl}/app/settings" style="color:#9ca3af;">Manage notification preferences</a>
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
