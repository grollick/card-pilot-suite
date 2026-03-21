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

    const now = new Date();
    let totalProcessed = 0;
    let totalScheduled = 0;

    // ═══════════════════════════════════════════
    // 1. Process scheduled automation_runs that are due
    // ═══════════════════════════════════════════
    const { data: dueRuns } = await supabase
      .from("automation_runs")
      .select("*, automation_rules(*)")
      .eq("status", "scheduled")
      .lte("scheduled_for", now.toISOString())
      .limit(50);

    for (const run of dueRuns ?? []) {
      const rule = run.automation_rules;
      if (!rule || !rule.enabled) {
        await supabase
          .from("automation_runs")
          .update({ status: "skipped", executed_at: now.toISOString() })
          .eq("id", run.id);
        continue;
      }

      const config = rule.action_config as Record<string, any>;
      const meta = run.meta_data as Record<string, any>;
      const contactName = meta?.contact_name ?? "Customer";

      try {
        if (rule.action_type === "send_email" && config.template_id) {
          // Fetch template
          const { data: template } = await supabase
            .from("email_templates")
            .select("subject, body")
            .eq("id", config.template_id)
            .single();

          if (template && meta?.contact_email) {
            // Replace template variables
            const vars: Record<string, string> = {
              "{{first_name}}": contactName.split(" ")[0],
              "{{name}}": contactName,
              "{{business_name}}": meta?.business_name ?? "",
              "{{service_name}}": meta?.service_name ?? "",
              "{{booking_link}}": meta?.booking_link ?? "",
              "{{promotion_text}}": meta?.promotion_text ?? "",
            };

            let subject = template.subject;
            let body = template.body;
            for (const [k, v] of Object.entries(vars)) {
              subject = subject.replaceAll(k, v);
              body = body.replaceAll(k, v);
            }

            // Send via send-email function
            await supabase.functions.invoke("send-email", {
              body: {
                to: meta.contact_email,
                subject,
                html: body,
                email_type: rule.trigger_type,
                lead_id: run.contact_id,
              },
            });
          }
        }

        if (rule.action_type === "create_task" && run.contact_id) {
          const title = (config.title ?? "Follow up")
            .replace("{name}", contactName);

          await supabase.from("tasks").insert({
            user_id: run.user_id,
            lead_id: run.contact_id,
            title,
            type: config.type ?? "follow_up",
            priority: config.priority ?? "medium",
            due_date: new Date().toISOString().split("T")[0],
            status: "open",
            created_by_user_id: run.user_id,
            assigned_to_user_id: run.user_id,
          });
        }

        if (rule.action_type === "log_activity" && run.contact_id) {
          await supabase.from("contact_activities").insert({
            user_id: run.user_id,
            lead_id: run.contact_id,
            activity_type: config.activity_type ?? "automation",
            title: (config.title ?? "Automation triggered").replace("{name}", contactName),
            description: config.description ?? `Automation: ${rule.trigger_type}`,
            occurred_at: now.toISOString(),
          });
        }

        // Log activity for all successful runs
        if (run.contact_id) {
          await supabase.from("contact_activities").insert({
            user_id: run.user_id,
            lead_id: run.contact_id,
            activity_type: "automation_executed",
            title: `Auto: ${rule.trigger_type} → ${rule.action_type}`,
            description: meta?.description ?? null,
            occurred_at: now.toISOString(),
          });
        }

        await supabase
          .from("automation_runs")
          .update({ status: "executed", executed_at: now.toISOString() })
          .eq("id", run.id);

        totalProcessed++;
      } catch (err) {
        console.error(`Run ${run.id} failed:`, err);
        await supabase
          .from("automation_runs")
          .update({
            status: "failed",
            executed_at: now.toISOString(),
            meta_data: { ...meta, error: err.message },
          })
          .eq("id", run.id);
      }
    }

    // ═══════════════════════════════════════════
    // 2. Scan for rebooking reminders (completed bookings needing follow-up)
    // ═══════════════════════════════════════════
    const { data: rebookRules } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("trigger_type", "customer_ready_to_rebook")
      .eq("enabled", true);

    for (const rule of rebookRules ?? []) {
      const triggerConfig = rule.trigger_config as Record<string, any>;
      const daysSince = triggerConfig.days_since_completed ?? 30;
      const cutoffDate = new Date(now.getTime() - daysSince * 86400000).toISOString();

      // Find completed bookings older than X days with no recent automation run
      const { data: eligibleBookings } = await supabase
        .from("bookings")
        .select("id, user_id, lead_id, customer_name, customer_email, service_id, booking_services(name)")
        .eq("user_id", rule.user_id)
        .eq("status", "completed")
        .lte("end_datetime", cutoffDate)
        .not("lead_id", "is", null)
        .limit(20);

      for (const booking of eligibleBookings ?? []) {
        // Check if we already scheduled a run for this booking+rule
        const { count } = await supabase
          .from("automation_runs")
          .select("id", { count: "exact", head: true })
          .eq("automation_id", rule.id)
          .eq("booking_id", booking.id);

        if ((count ?? 0) > 0) continue;

        // Schedule the run
        await supabase.from("automation_runs").insert({
          automation_id: rule.id,
          user_id: rule.user_id,
          contact_id: booking.lead_id,
          booking_id: booking.id,
          status: "scheduled",
          scheduled_for: now.toISOString(),
          meta_data: {
            contact_name: booking.customer_name,
            contact_email: booking.customer_email,
            service_name: (booking.booking_services as any)?.name ?? "",
            description: `Rebooking reminder: ${daysSince} days since last service`,
          },
        });
        totalScheduled++;
      }
    }

    // ═══════════════════════════════════════════
    // 3. Scan for win-back campaigns (inactive contacts)
    // ═══════════════════════════════════════════
    const { data: winbackRules } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("trigger_type", "contact_inactive")
      .eq("enabled", true);

    for (const rule of winbackRules ?? []) {
      const triggerConfig = rule.trigger_config as Record<string, any>;
      const inactiveDays = triggerConfig.inactive_days ?? 60;
      const cutoffDate = new Date(now.getTime() - inactiveDays * 86400000).toISOString();

      // Find contacts with no recent activity
      const { data: inactiveContacts } = await supabase
        .from("leads")
        .select("id, name, email, last_activity_at")
        .eq("user_id", rule.user_id)
        .eq("status", "open")
        .or(`last_activity_at.lte.${cutoffDate},last_activity_at.is.null`)
        .limit(20);

      for (const contact of inactiveContacts ?? []) {
        const { count } = await supabase
          .from("automation_runs")
          .select("id", { count: "exact", head: true })
          .eq("automation_id", rule.id)
          .eq("contact_id", contact.id)
          .in("status", ["scheduled", "executed"]);

        if ((count ?? 0) > 0) continue;

        await supabase.from("automation_runs").insert({
          automation_id: rule.id,
          user_id: rule.user_id,
          contact_id: contact.id,
          status: "scheduled",
          scheduled_for: now.toISOString(),
          meta_data: {
            contact_name: contact.name,
            contact_email: contact.email,
            description: `Win-back: ${inactiveDays} days inactive`,
          },
        });
        totalScheduled++;
      }
    }

    return new Response(
      JSON.stringify({ processed: totalProcessed, scheduled: totalScheduled }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-revenue-automations error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
