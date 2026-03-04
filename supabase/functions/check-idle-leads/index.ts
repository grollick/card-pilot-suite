import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all enabled lead_idle rules
    const { data: rules, error: rulesErr } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("trigger_type", "lead_idle")
      .eq("enabled", true);

    if (rulesErr) throw rulesErr;
    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ message: "No idle rules", executed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalExecuted = 0;

    // Group rules by user
    const rulesByUser = new Map<string, typeof rules>();
    for (const rule of rules) {
      const arr = rulesByUser.get(rule.user_id) ?? [];
      arr.push(rule);
      rulesByUser.set(rule.user_id, arr);
    }

    for (const [userId, userRules] of rulesByUser) {
      // Find the minimum idle_days across this user's rules
      const minIdleDays = Math.min(...userRules.map(r => (r.trigger_config as any).idle_days ?? 7));
      const cutoff = new Date(Date.now() - minIdleDays * 86400000).toISOString();

      // Fetch contacts that have been idle
      const { data: idleLeads } = await supabase
        .from("leads")
        .select("id, name, last_activity_at")
        .eq("user_id", userId)
        .eq("status", "open")
        .or(`last_activity_at.is.null,last_activity_at.lt.${cutoff}`)
        .limit(100);

      if (!idleLeads || idleLeads.length === 0) continue;

      for (const lead of idleLeads) {
        const leadIdleDays = lead.last_activity_at
          ? Math.floor((Date.now() - new Date(lead.last_activity_at).getTime()) / 86400000)
          : 999;

        for (const rule of userRules) {
          const requiredDays = (rule.trigger_config as any).idle_days ?? 7;
          if (leadIdleDays < requiredDays) continue;

          // Call the run-automations function for this lead
          const res = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/run-automations`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                userId,
                triggerType: "lead_idle",
                context: {
                  contactId: lead.id,
                  contactName: lead.name,
                },
              }),
            }
          );

          if (res.ok) {
            const result = await res.json();
            totalExecuted += result.executed ?? 0;
          }
        }
      }
    }

    return new Response(JSON.stringify({ executed: totalExecuted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
