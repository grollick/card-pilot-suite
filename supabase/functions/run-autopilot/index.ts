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

  // Auth guard: only allow calls with service role key (cron-only endpoint)
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  if (token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // This function is designed to be called by a cron job or manually
    // It processes all users who have autopilot enabled
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: allSettings } = await admin
      .from("autopilot_settings")
      .select("*")
      .eq("enabled", true);

    if (!allSettings || allSettings.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalActions = 0;

    for (const settings of allSettings) {
      const userId = settings.user_id;
      const actions: { action_type: string; title: string; description: string; meta_json: any }[] = [];
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get user profile for personalization
      const { data: profile } = await admin
        .from("profiles")
        .select("name, company, profession_id")
        .eq("id", userId)
        .single();

      const businessName = profile?.company || profile?.name || "our team";

      // ── 1. Lead Follow-up ──
      if (settings.lead_followup) {
        const { data: newLeads } = await admin
          .from("leads")
          .select("id, name, email, phone, created_at")
          .eq("user_id", userId)
          .eq("status", "open")
          .gte("created_at", oneDayAgo)
          .is("last_activity_at", null);

        for (const lead of newLeads ?? []) {
          // Check if we already sent a follow-up
          const { count } = await admin
            .from("autopilot_log")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("action_type", "lead_followup")
            .eq("meta_json->>lead_id", lead.id);

          if ((count ?? 0) === 0) {
            let message = `Thanks for contacting ${businessName}! We'd love to help. Let us know if you'd like a quote or to schedule a visit.`;

            // Use AI to personalize if available
            if (LOVABLE_API_KEY) {
              try {
                const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${LOVABLE_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    model: "google/gemini-2.5-flash-lite",
                    messages: [
                      { role: "system", content: "Write a short, warm, professional follow-up message (2-3 sentences max) from a business to a new lead. Be friendly but not pushy. Don't use markdown." },
                      { role: "user", content: `Business: ${businessName}. New lead name: ${lead.name}. Write a brief follow-up message.` },
                    ],
                  }),
                });
                if (aiResp.ok) {
                  const aiData = await aiResp.json();
                  const content = aiData.choices?.[0]?.message?.content;
                  if (content) message = content;
                }
              } catch { /* use default */ }
            }

            if (settings.approval_mode === "automatic") {
              // Log the action (in a real system, this would also trigger email/SMS send)
              actions.push({
                action_type: "lead_followup",
                title: `Follow-up sent to ${lead.name}`,
                description: message,
                meta_json: { lead_id: lead.id, lead_name: lead.name },
              });

              // Update lead activity
              await admin.from("leads").update({ last_activity_at: now.toISOString() }).eq("id", lead.id);
            } else {
              actions.push({
                action_type: "lead_followup",
                title: `Follow-up ready for ${lead.name}`,
                description: message,
                meta_json: { lead_id: lead.id, lead_name: lead.name, requires_approval: true },
              });
            }
          }
        }
      }

      // ── 2. Estimate Reminders ──
      if (settings.estimate_reminders) {
        const { data: pendingEstimates } = await admin
          .from("estimates")
          .select("id, estimate_number, lead_id, grand_total, created_at")
          .eq("user_id", userId)
          .eq("status", "sent")
          .lt("created_at", threeDaysAgo);

        for (const est of pendingEstimates ?? []) {
          const { count } = await admin
            .from("autopilot_log")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("action_type", "estimate_reminder")
            .eq("meta_json->>estimate_id", est.id);

          if ((count ?? 0) === 0) {
            // Get lead name
            let leadName = "there";
            if (est.lead_id) {
              const { data: lead } = await admin.from("leads").select("name").eq("id", est.lead_id).single();
              if (lead) leadName = lead.name;
            }

            actions.push({
              action_type: "estimate_reminder",
              title: `Estimate reminder for #${est.estimate_number}`,
              description: `Hi ${leadName}, just checking if you had a chance to review the estimate we sent for $${Number(est.grand_total).toLocaleString()}. We're happy to answer any questions!`,
              meta_json: { estimate_id: est.id, estimate_number: est.estimate_number, lead_id: est.lead_id },
            });
          }
        }
      }

      // ── 3. Review Requests ──
      if (settings.review_requests) {
        const { data: completedJobs } = await admin
          .from("jobs")
          .select("id, title, lead_id, actual_end")
          .eq("user_id", userId)
          .eq("status", "completed")
          .gte("actual_end", sevenDaysAgo);

        for (const job of completedJobs ?? []) {
          const { count } = await admin
            .from("autopilot_log")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("action_type", "review_request")
            .eq("meta_json->>job_id", job.id);

          if ((count ?? 0) === 0 && job.lead_id) {
            const { data: lead } = await admin.from("leads").select("name").eq("id", job.lead_id).single();
            actions.push({
              action_type: "review_request",
              title: `Review request for "${job.title}"`,
              description: `Hi ${lead?.name ?? "there"}, we hope you loved the ${job.title} service! Would you mind leaving a quick review? It really helps our business grow.`,
              meta_json: { job_id: job.id, lead_id: job.lead_id },
            });
          }
        }
      }

      // ── 4. Social Posts ──
      if (settings.social_posts && LOVABLE_API_KEY) {
        // Check if user has posted recently
        const { count: recentPosts } = await admin
          .from("autopilot_log")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("action_type", "social_post")
          .gte("created_at", threeDaysAgo);

        if ((recentPosts ?? 0) === 0) {
          try {
            const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash-lite",
                messages: [
                  { role: "system", content: "Write a short, engaging social media post (2-3 sentences) for a local business. Include a call to action. No hashtags, no emojis, no markdown." },
                  { role: "user", content: `Business: ${businessName}. Write a social media post promoting their services.` },
                ],
              }),
            });
            if (aiResp.ok) {
              const aiData = await aiResp.json();
              const content = aiData.choices?.[0]?.message?.content;
              if (content) {
                actions.push({
                  action_type: "social_post",
                  title: "Social post drafted",
                  description: content,
                  meta_json: { generated: true },
                });
              }
            }
          } catch { /* skip */ }
        }
      }

      // ── 5. Promotions (empty schedule detection) ──
      if (settings.promotions) {
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: upcomingBookings } = await admin
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("start_datetime", now.toISOString())
          .lte("start_datetime", nextWeek)
          .in("status", ["confirmed", "pending"]);

        if ((upcomingBookings ?? 0) < 2) {
          const { count: recentPromos } = await admin
            .from("autopilot_log")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("action_type", "promotion")
            .gte("created_at", sevenDaysAgo);

          if ((recentPromos ?? 0) === 0) {
            actions.push({
              action_type: "promotion",
              title: "Schedule has openings",
              description: `Your schedule looks light next week with only ${upcomingBookings ?? 0} bookings. Consider running a limited-time promotion or sending an availability email to recent contacts.`,
              meta_json: { upcoming_bookings: upcomingBookings ?? 0 },
            });
          }
        }
      }

      // ── Insert all actions into log ──
      if (actions.length > 0) {
        const rows = actions.map(a => ({
          user_id: userId,
          action_type: a.action_type,
          title: a.title,
          description: a.description,
          status: a.meta_json.requires_approval ? "pending_approval" : "completed",
          meta_json: a.meta_json,
        }));
        await admin.from("autopilot_log").insert(rows);
        totalActions += actions.length;
      }
    }

    return new Response(JSON.stringify({ processed: allSettings.length, actions: totalActions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("run-autopilot error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
