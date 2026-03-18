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
    const { userId, triggerType, context } = await req.json();

    if (!userId || !triggerType || !context?.contactId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch enabled rules for this trigger
    const { data: rules, error: rulesErr } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("user_id", userId)
      .eq("trigger_type", triggerType)
      .eq("enabled", true);

    if (rulesErr) throw rulesErr;
    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ executed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let executed = 0;

    for (const rule of rules) {
      const config = rule.action_config as Record<string, any>;
      const triggerConfig = rule.trigger_config as Record<string, any>;

      // Check trigger conditions
      if (triggerType === "stage_changed" && triggerConfig.to_stage_name_contains) {
        if (!context.toStageName?.toLowerCase().includes(triggerConfig.to_stage_name_contains.toLowerCase())) {
          continue;
        }
      }

      const title = (config.title ?? "Follow up")
        .replace("{name}", context.contactName ?? "Contact");

      if (rule.action_type === "create_task") {
        let dueDate: string | null = null;
        const now = new Date();

        if (config.due_offset_hours !== undefined) {
          const d = new Date(now.getTime() + config.due_offset_hours * 3600000);
          dueDate = d.toISOString().split("T")[0];
        }
        if (config.due_before_hours !== undefined && context.bookingStartAt) {
          const d = new Date(new Date(context.bookingStartAt).getTime() - config.due_before_hours * 3600000);
          dueDate = d.toISOString().split("T")[0];
        }

        await supabase.from("tasks").insert({
          user_id: userId,
          lead_id: context.contactId,
          title,
          type: config.type ?? "follow_up",
          priority: config.priority ?? "medium",
          due_date: dueDate,
          status: "open",
          created_by_user_id: userId,
          assigned_to_user_id: userId,
        });

        await supabase.from("contact_activities").insert({
          user_id: userId,
          lead_id: context.contactId,
          activity_type: "task_created",
          title: `Auto: ${title}`,
          occurred_at: new Date().toISOString(),
        });
        executed++;
      }

      if (rule.action_type === "log_activity") {
        await supabase.from("contact_activities").insert({
          user_id: userId,
          lead_id: context.contactId,
          activity_type: config.activity_type ?? "note",
          title,
          description: config.description ?? "",
          occurred_at: new Date().toISOString(),
        });
        executed++;
      }

      if (rule.action_type === "send_email") {
        await supabase.from("contact_activities").insert({
          user_id: userId,
          lead_id: context.contactId,
          activity_type: "email",
          title: `Auto: ${title}`,
          description: `Queued from template (${config.template_id ?? "none"})`,
          occurred_at: new Date().toISOString(),
        });
        executed++;
      }

      if (rule.action_type === "move_stage") {
        const targetStageId = config.target_stage_id;
        if (targetStageId) {
          await supabase.from("leads").update({ stage_id: targetStageId }).eq("id", context.contactId);
          await supabase.from("contact_activities").insert({
            user_id: userId,
            lead_id: context.contactId,
            activity_type: "stage_change",
            title: `Auto: ${title}`,
            occurred_at: new Date().toISOString(),
          });
          executed++;
        }
      }

      if (rule.action_type === "send_notification") {
        await supabase.from("contact_activities").insert({
          user_id: userId,
          lead_id: context.contactId,
          activity_type: "notification",
          title: `🔔 ${title}`,
          description: config.message ?? "",
          occurred_at: new Date().toISOString(),
        });
        executed++;
      }
    }

    return new Response(JSON.stringify({ executed, total_rules: rules.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("run-automations error:", err);

    try {
      const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await svc.from("system_events").insert({
        event_type: "automation_failure",
        severity: "error",
        message: err.message ?? "Automation execution failed",
        meta_data: { function: "run-automations" },
      });
    } catch (_) { /* best effort */ }

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
