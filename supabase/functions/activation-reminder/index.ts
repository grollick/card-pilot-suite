import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth guard: only allow calls with service role key (cron-only endpoint)
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  if (token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find users who signed up 24+ hours ago with 0 leads and a published card
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: profiles, error: profilesErr } = await supabase
      .from("profiles")
      .select("id, email, name, handle")
      .lt("created_at", cutoff)
      .not("handle", "is", null);

    if (profilesErr) throw profilesErr;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;

    for (const profile of profiles) {
      // Check if they already have leads
      const { count: leadCount } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id);

      if ((leadCount ?? 0) > 0) continue;

      // Check if reminder already sent (use system_events or a simple check)
      const { count: reminderCount } = await supabase
        .from("autopilot_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("action_type", "activation_reminder");

      if ((reminderCount ?? 0) > 0) continue;

      // Send reminder email via send-email function
      const firstName = profile.name?.split(" ")[0] || "there";
      const cardUrl = `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "")?.includes("http") ? "" : "https://"}${profile.handle ? `guzzl.pro/${profile.handle}` : ""}`;

      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey && profile.email) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "guzzl.pro <noreply@guzzl-pro.app>",
              to: [profile.email],
              subject: `${firstName}, your card is ready — now let's get your first lead! 🚀`,
              html: `
                <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
                  <h2 style="color: #1a1a1a;">Hey ${firstName}! 👋</h2>
                  <p style="color: #555; line-height: 1.6;">
                    Your digital business card is live, but you haven't gotten your first lead yet.
                    Here's how to change that in the next hour:
                  </p>
                  <ol style="color: #555; line-height: 1.8;">
                    <li><strong>Text your card link</strong> to 5 friends or past clients</li>
                    <li><strong>Post it</strong> on Facebook, Instagram, or Nextdoor</li>
                    <li><strong>Add it</strong> to your social media bio</li>
                  </ol>
                  <p style="color: #555; line-height: 1.6;">
                    Most guzzl.pro users get their first lead within 48 hours of sharing. You're almost there!
                  </p>
                  <a href="https://guzzl.pro/app" 
                     style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 12px;">
                    Share Your Card Now →
                  </a>
                  <p style="color: #999; font-size: 12px; margin-top: 24px;">
                    You're receiving this because you signed up for guzzl.pro and haven't gotten your first lead yet.
                  </p>
                </div>
              `,
            }),
          });
          sent++;
        } catch (emailErr) {
          console.error("Failed to send activation reminder:", emailErr);
        }
      }

      // Log that reminder was sent
      await supabase.from("autopilot_log").insert({
        user_id: profile.id,
        action_type: "activation_reminder",
        title: "24-hour activation reminder sent",
        description: `Reminder email sent to ${profile.email}`,
        status: "completed",
      });
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Activation reminder error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
