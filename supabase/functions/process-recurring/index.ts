import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];

    // Get active plans where next_service_date <= today
    const { data: plans, error: plansErr } = await supabase
      .from("recurring_plans")
      .select("*, leads(name, email, phone)")
      .eq("status", "active")
      .lte("next_service_date", today);

    if (plansErr) throw plansErr;
    if (!plans || plans.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const plan of plans) {
      // Skip if skip_next is set
      if (plan.skip_next) {
        // Calculate next date and clear skip flag
        const nextDate = calculateNext(plan.frequency, new Date(plan.next_service_date), plan.custom_interval_days);
        await supabase.from("recurring_plans").update({
          skip_next: false,
          next_service_date: nextDate,
        }).eq("id", plan.id);
        continue;
      }

      // Check end date
      if (plan.end_date && plan.next_service_date > plan.end_date) {
        await supabase.from("recurring_plans").update({ status: "completed" }).eq("id", plan.id);
        continue;
      }

      // Create a job for this service visit
      const jobNumber = `JOB-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;

      const { data: job, error: jobErr } = await supabase.from("jobs").insert({
        user_id: plan.user_id,
        lead_id: plan.lead_id,
        title: plan.service_name,
        job_number: jobNumber,
        job_type: "recurring",
        status: "scheduled",
        scheduled_start: new Date(plan.next_service_date).toISOString(),
        internal_notes: `Auto-generated from recurring plan`,
      }).select().single();

      if (jobErr) {
        console.error(`Failed to create job for plan ${plan.id}:`, jobErr);
        continue;
      }

      // Create invoice if billing_cycle is per_visit
      if (plan.billing_cycle === "per_visit") {
        const invoiceNumber = `INV-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        await supabase.from("invoices").insert({
          user_id: plan.user_id,
          job_id: job.id,
          lead_id: plan.lead_id,
          invoice_number: invoiceNumber,
          status: "draft",
          subtotal: plan.price,
          grand_total: plan.price,
          due_date: dueDate.toISOString().split("T")[0],
        });
      }

      // Log CRM activity
      if (plan.lead_id) {
        await supabase.from("contact_activities").insert({
          lead_id: plan.lead_id,
          user_id: plan.user_id,
          activity_type: "recurring_service_scheduled",
          title: `Recurring: ${plan.service_name} scheduled (${jobNumber})`,
          related_id: job.id,
        });
      }

      // Advance next_service_date
      const nextDate = calculateNext(plan.frequency, new Date(plan.next_service_date), plan.custom_interval_days);
      await supabase.from("recurring_plans").update({
        next_service_date: nextDate,
        visits_completed: (plan.visits_completed || 0) + 1,
        last_completed_at: new Date().toISOString(),
      }).eq("id", plan.id);

      processed++;
    }

    return new Response(JSON.stringify({ processed, total: plans.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("process-recurring error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateNext(frequency: string, from: Date, customDays?: number): string {
  const d = new Date(from);
  switch (frequency) {
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "biweekly": d.setDate(d.getDate() + 14); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "custom": d.setDate(d.getDate() + (customDays || 30)); break;
  }
  return d.toISOString().split("T")[0];
}
