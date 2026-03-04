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
    const body = await req.json();
    const { type, user_id, data } = body;

    if (!type || !user_id) {
      return new Response(JSON.stringify({ error: "Missing type or user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result: any = null;

    switch (type) {
      case "new_contact": {
        const { name, email, phone, company, source, notes } = data ?? {};
        if (!name) {
          return new Response(JSON.stringify({ error: "name is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: lead, error } = await supabase
          .from("leads")
          .insert({
            user_id,
            name,
            email: email ?? null,
            phone: phone ?? null,
            company: company ?? null,
            source: source ?? "other",
            notes: notes ?? null,
          })
          .select()
          .single();
        if (error) throw error;
        result = lead;

        // Trigger automation
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/run-automations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            userId: user_id,
            triggerType: "new_lead",
            context: { contactId: lead.id, contactName: name },
          }),
        });
        break;
      }

      case "new_booking": {
        const { customer_name, customer_email, customer_phone, start_datetime, end_datetime, service_id, notes } = data ?? {};
        if (!customer_name || !start_datetime || !end_datetime) {
          return new Response(JSON.stringify({ error: "customer_name, start_datetime, end_datetime required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: booking, error } = await supabase
          .from("bookings")
          .insert({
            user_id,
            customer_name,
            customer_email: customer_email ?? null,
            customer_phone: customer_phone ?? null,
            start_datetime,
            end_datetime,
            service_id: service_id ?? null,
            notes: notes ?? null,
            status: "pending",
          })
          .select()
          .single();
        if (error) throw error;
        result = booking;
        break;
      }

      case "log_activity": {
        const { lead_id, activity_type, title, description } = data ?? {};
        if (!lead_id || !title) {
          return new Response(JSON.stringify({ error: "lead_id and title required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: activity, error } = await supabase
          .from("contact_activities")
          .insert({
            user_id,
            lead_id,
            activity_type: activity_type ?? "note",
            title,
            description: description ?? null,
            occurred_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        result = activity;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown webhook type: ${type}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
