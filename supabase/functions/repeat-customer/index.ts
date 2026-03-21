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

    // Find bookings completed 30 days ago (±1 day window)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const windowStart = new Date(thirtyDaysAgo.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const windowEnd = thirtyDaysAgo.toISOString();

    const { data: eligibleBookings } = await supabase
      .from("bookings")
      .select("id, user_id, customer_name, customer_email, lead_id, service_id, booking_services(name)")
      .eq("status", "completed")
      .gte("updated_at", windowStart)
      .lt("updated_at", windowEnd)
      .not("customer_email", "is", null);

    if (!eligibleBookings || eligibleBookings.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const booking of eligibleBookings) {
      try {
        // Check if we already sent a rebooking reminder for this booking
        const { count } = await supabase
          .from("contact_activities")
          .select("*", { count: "exact", head: true })
          .eq("related_id", booking.id)
          .eq("activity_type", "rebooking_reminder");

        if ((count ?? 0) > 0) continue; // Already sent

        // Get card owner profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email, handle, company")
          .eq("id", booking.user_id)
          .single();

        if (!profile) continue;

        const serviceName = (booking as any).booking_services?.name || "your appointment";
        const bookingLink = `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || ""}/book/${profile.handle}`;

        // Send rebooking email to customer
        await supabase.functions.invoke("send-email", {
          body: {
            to: booking.customer_email,
            subject: `Time to rebook? We'd love to see you again!`,
            html: `
              <div style="font-family:'DM Sans',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;">
                <h2 style="color:#1a1a2e;margin:0 0 8px;">Time to Rebook!</h2>
                <p style="color:#374151;margin:0 0 16px;">Hi ${booking.customer_name},</p>
                <p style="color:#374151;margin:0 0 16px;">
                  It's been about 30 days since your last ${serviceName} with ${profile.company || profile.name}. We'd love to see you again!
                </p>
                <a href="${bookingLink}" 
                   style="display:inline-block;padding:12px 24px;background:#4361ee;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                  Book Again
                </a>
                <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">
                  Sent via guzzl.pro on behalf of ${profile.company || profile.name}
                </p>
              </div>
            `,
            email_type: "custom",
          },
        });

        // Log activity
        if (booking.lead_id) {
          await supabase.from("contact_activities").insert({
            user_id: booking.user_id,
            lead_id: booking.lead_id,
            activity_type: "rebooking_reminder",
            title: "Rebooking reminder sent",
            description: `Automated 30-day rebooking reminder for ${serviceName}`,
            related_id: booking.id,
          });
        }

        processed++;
      } catch (bookingErr) {
        console.error(`Failed rebooking reminder for booking ${booking.id}:`, bookingErr);
      }
    }

    return new Response(JSON.stringify({ processed, total: eligibleBookings.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("repeat-customer error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
