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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const action = (await req.json().catch(() => ({})))?.action ?? "process";

    // ── Action: enroll_new_signups ──
    if (action === "enroll_new_signups") {
      return await enrollNewSignups(supabase);
    }

    // ── Action: check_stop_conditions ──
    if (action === "check_stop_conditions") {
      return await checkStopConditions(supabase);
    }

    // ── Default: process pending emails ──
    // Get active enrollments that are due for next step
    const { data: enrollments, error: eErr } = await supabase
      .from("email_sequence_enrollments")
      .select(`
        *,
        email_sequences!inner(*, status)
      `)
      .eq("status", "active")
      .eq("email_sequences.status", "active");

    if (eErr) throw eErr;
    if (!enrollments || enrollments.length === 0) {
      return jsonRes({ processed: 0, message: "No active enrollments" });
    }

    let sent = 0;
    let skipped = 0;
    let completed = 0;

    for (const enrollment of enrollments) {
      const sequence = enrollment.email_sequences as any;
      const nextStep = enrollment.current_step + 1;

      // Get the next step
      const { data: step } = await supabase
        .from("email_sequence_steps")
        .select("*")
        .eq("sequence_id", enrollment.sequence_id)
        .eq("step_number", nextStep)
        .eq("enabled", true)
        .maybeSingle();

      if (!step) {
        // No more steps — mark completed
        await supabase
          .from("email_sequence_enrollments")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", enrollment.id);
        completed++;
        continue;
      }

      // Check delay: hours since last email or enrollment
      const referenceTime = enrollment.last_email_at || enrollment.enrolled_at;
      const hoursSince =
        (Date.now() - new Date(referenceTime).getTime()) / (1000 * 60 * 60);

      if (hoursSince < step.delay_hours) {
        skipped++;
        continue;
      }

      // Check daily limit
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from("email_sequence_events")
        .select("*", { count: "exact", head: true })
        .eq("enrollment_id", enrollment.id)
        .eq("event_type", "email_sent")
        .gte("created_at", todayStart.toISOString());

      if ((todayCount ?? 0) >= sequence.max_emails_per_day) {
        skipped++;
        continue;
      }

      // Get user profile for personalization
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email, business_name, handle")
        .eq("id", enrollment.user_id)
        .maybeSingle();

      if (!profile?.email) {
        skipped++;
        continue;
      }

      // Resolve personalization
      const firstName = (profile.name || "").split(" ")[0] || "there";
      const resolvedSubject = step.subject
        .replace(/\{\{name\}\}/g, firstName)
        .replace(/\{\{business\}\}/g, profile.business_name || "your business");
      const resolvedBody = step.body
        .replace(/\{\{name\}\}/g, firstName)
        .replace(/\{\{business\}\}/g, profile.business_name || "your business")
        .replace(/\{\{booking_link\}\}/g, profile.handle ? `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/book/${profile.handle}` : "#");

      // Wrap in HTML
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
          ${resolvedBody.split("\n").map((line: string) =>
            line.trim() ? `<p style="color: #1a1a2e; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">${line}</p>` : ""
          ).join("")}
        </div>
        <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="font-size:11px;color:#9ca3af;margin:0;">
            Sent via <a href="https://guzzl.pro" style="color:#4361ee;text-decoration:none;font-weight:600;">guzzl.pro</a>
          </p>
        </div>
      `;

      // Send email via send-email function
      const { error: sendErr } = await supabase.functions.invoke("send-email", {
        body: {
          to: profile.email,
          subject: resolvedSubject,
          html,
          email_type: "sequence",
        },
      });

      if (sendErr) {
        // Log failure
        await supabase.from("email_sequence_events").insert({
          enrollment_id: enrollment.id,
          step_id: step.id,
          event_type: "email_failed",
          meta_data: { error: sendErr.message },
        });
        continue;
      }

      // Update enrollment
      await supabase
        .from("email_sequence_enrollments")
        .update({
          current_step: nextStep,
          last_email_at: new Date().toISOString(),
        })
        .eq("id", enrollment.id);

      // Log success
      await supabase.from("email_sequence_events").insert({
        enrollment_id: enrollment.id,
        step_id: step.id,
        event_type: "email_sent",
        meta_data: { subject: resolvedSubject, to: profile.email },
      });

      sent++;
    }

    return jsonRes({ processed: enrollments.length, sent, skipped, completed });
  } catch (err) {
    console.error("process-email-sequences error:", err);
    return jsonRes({ error: err.message }, 500);
  }
});

// ── Enrollment logic ──
async function enrollNewSignups(supabase: any) {
  // Get active sequences with signup trigger
  const { data: sequences } = await supabase
    .from("email_sequences")
    .select("id, trigger_type, trigger_config")
    .eq("status", "active");

  if (!sequences || sequences.length === 0) {
    return jsonRes({ enrolled: 0 });
  }

  let totalEnrolled = 0;

  for (const seq of sequences) {
    // Get users who match trigger but aren't enrolled
    let usersQuery = supabase.from("profiles").select("id");

    if (seq.trigger_type === "signup") {
      const hoursBack = seq.trigger_config?.hours_back ?? 24;
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
      usersQuery = usersQuery.gte("created_at", since);
    } else if (seq.trigger_type === "incomplete_profile") {
      usersQuery = usersQuery.or("handle.is.null,business_name.is.null");
    } else if (seq.trigger_type === "inactivity") {
      const days = seq.trigger_config?.inactive_days ?? 7;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      usersQuery = usersQuery.lt("updated_at", cutoff);
    } else {
      continue;
    }

    const { data: users } = await usersQuery.limit(50);
    if (!users || users.length === 0) continue;

    // Filter out already-enrolled users
    const userIds = users.map((u: any) => u.id);
    const { data: existing } = await supabase
      .from("email_sequence_enrollments")
      .select("user_id")
      .eq("sequence_id", seq.id)
      .in("user_id", userIds);

    const existingIds = new Set((existing || []).map((e: any) => e.user_id));
    const newUsers = userIds.filter((id: string) => !existingIds.has(id));

    if (newUsers.length === 0) continue;

    const rows = newUsers.map((user_id: string) => ({
      sequence_id: seq.id,
      user_id,
      status: "active",
    }));

    const { error } = await supabase
      .from("email_sequence_enrollments")
      .insert(rows);

    if (!error) totalEnrolled += newUsers.length;
  }

  return jsonRes({ enrolled: totalEnrolled });
}

// ── Stop condition checker ──
async function checkStopConditions(supabase: any) {
  const { data: active } = await supabase
    .from("email_sequence_enrollments")
    .select("id, user_id, sequence_id, current_step")
    .eq("status", "active");

  if (!active || active.length === 0) {
    return jsonRes({ checked: 0, cancelled: 0 });
  }

  let cancelled = 0;

  for (const enrollment of active) {
    // Get the current step's stop conditions
    const { data: step } = await supabase
      .from("email_sequence_steps")
      .select("stop_conditions")
      .eq("sequence_id", enrollment.sequence_id)
      .eq("step_number", enrollment.current_step)
      .maybeSingle();

    const conditions = step?.stop_conditions || [];
    if (!Array.isArray(conditions) || conditions.length === 0) continue;

    let shouldStop = false;
    let reason = "";

    for (const cond of conditions) {
      if (cond.type === "profile_complete") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("handle, business_name")
          .eq("id", enrollment.user_id)
          .maybeSingle();
        if (profile?.handle && profile?.business_name) {
          shouldStop = true;
          reason = "Profile completed";
        }
      } else if (cond.type === "has_card") {
        const { count } = await supabase
          .from("cards")
          .select("*", { count: "exact", head: true })
          .eq("user_id", enrollment.user_id)
          .eq("status", "published");
        if ((count ?? 0) > 0) {
          shouldStop = true;
          reason = "Card published";
        }
      } else if (cond.type === "has_lead") {
        const { count } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("user_id", enrollment.user_id);
        if ((count ?? 0) > 0) {
          shouldStop = true;
          reason = "Has leads";
        }
      } else if (cond.type === "is_active") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("updated_at")
          .eq("id", enrollment.user_id)
          .maybeSingle();
        const daysSince = profile
          ? (Date.now() - new Date(profile.updated_at).getTime()) / (1000 * 60 * 60 * 24)
          : 999;
        if (daysSince < 3) {
          shouldStop = true;
          reason = "User became active";
        }
      } else if (cond.type === "plan_upgraded") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", enrollment.user_id)
          .maybeSingle();
        if (profile?.plan && profile.plan !== "starter") {
          shouldStop = true;
          reason = "Plan upgraded";
        }
      }

      if (shouldStop) break;
    }

    if (shouldStop) {
      await supabase
        .from("email_sequence_enrollments")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancel_reason: reason,
        })
        .eq("id", enrollment.id);

      await supabase.from("email_sequence_events").insert({
        enrollment_id: enrollment.id,
        event_type: "auto_cancelled",
        meta_data: { reason },
      });

      cancelled++;
    }
  }

  return jsonRes({ checked: active.length, cancelled });
}

function jsonRes(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
