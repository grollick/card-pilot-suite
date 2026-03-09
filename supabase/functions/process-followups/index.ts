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

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch pending followups that are due
    const { data: followups, error: fetchErr } = await supabase
      .from("scheduled_followups")
      .select("*")
      .eq("status", "pending")
      .lte("send_at", new Date().toISOString())
      .limit(50);

    if (fetchErr) throw fetchErr;
    if (!followups || followups.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sent = 0;
    let failed = 0;

    for (const followup of followups) {
      try {
        // Get card owner's profile for sender info
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email, handle, followup_enabled, followup_subject, followup_body")
          .eq("id", followup.user_id)
          .single();

        if (!profile || !profile.followup_enabled || !followup.recipient_email) {
          await supabase
            .from("scheduled_followups")
            .update({ status: "skipped", sent_at: new Date().toISOString() })
            .eq("id", followup.id);
          continue;
        }

        // Get step-specific template if step_id exists, else fall back to profile defaults
        let subject = profile.followup_subject || "Thanks for connecting!";
        let body = profile.followup_body || "Thanks for reaching out!";
        let selectedVariantId = null;

        if (followup.step_id) {
          // First try to get variants for A/B testing
          const { data: variants } = await supabase
            .from("followup_variants")
            .select("id, subject, body, weight")
            .eq("step_id", followup.step_id)
            .order("variant_key");

          if (variants && variants.length > 0) {
            // Weighted random selection
            const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
            if (totalWeight > 0) {
              let random = Math.random() * totalWeight;
              
              for (const variant of variants) {
                random -= variant.weight;
                if (random <= 0) {
                  subject = variant.subject;
                  body = variant.body;
                  selectedVariantId = variant.id;
                  break;
                }
              }
            }
          } else {
            // Fall back to default step template if no variants
            const { data: step } = await supabase
              .from("followup_steps")
              .select("subject, body")
              .eq("id", followup.step_id)
              .single();
            if (step) {
              subject = step.subject;
              body = step.body;
            }
          }
        }

        // Replace template variables
        const recipientFirstName = (followup.recipient_name || "there").split(" ")[0];
        const variables: Record<string, string> = {
          "{{name}}": followup.recipient_name || "there",
          "{{first_name}}": recipientFirstName,
          "{{sender_name}}": profile.name || "Your contact",
          "{{sender_email}}": profile.email || "",
          "{{card_link}}": profile.handle
            ? `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "")?.includes("localhost") ? "http://localhost:5173" : "https://" + (profile.handle + ".cardpilot.app")}/${profile.handle}`
            : "",
          "{{step_number}}": String(followup.step_number || 1),
        };

        for (const [key, value] of Object.entries(variables)) {
          subject = subject.replaceAll(key, value);
          body = body.replaceAll(key, value);
        }

        // Convert body line breaks to HTML
        const htmlBody = body.replace(/\n/g, "<br>");

        const emailHtml = `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
            <h2 style="color:#4361ee;margin:0 0 16px;">${subject}</h2>
            <div style="color:#374151;line-height:1.7;">
              ${htmlBody}
            </div>
            <p style="color:#374151;margin:24px 0 0;">
              — ${profile.name || ""}
            </p>
            <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">
              Sent via CardPilot
            </p>
          </div>
        `;

        // Send via Resend
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${profile.name || "CardPilot"} <onboarding@resend.dev>`,
            to: [followup.recipient_email],
            subject,
            html: emailHtml,
            reply_to: profile.email || undefined,
          }),
        });

        if (!resendRes.ok) {
          const errData = await resendRes.json();
          console.error("Resend error for followup", followup.id, errData);
          await supabase
            .from("scheduled_followups")
            .update({ status: "failed" })
            .eq("id", followup.id);
          failed++;
          continue;
        }

        // Mark as sent and record which variant was used
        await supabase
          .from("scheduled_followups")
          .update({ 
            status: "sent", 
            sent_at: new Date().toISOString(),
            variant_id: selectedVariantId 
          })
          .eq("id", followup.id);

        // Log activity on the lead
        if (followup.lead_id) {
          await supabase.from("contact_activities").insert({
            user_id: followup.user_id,
            lead_id: followup.lead_id,
            activity_type: "email",
            title: "Auto follow-up email sent",
            description: `Subject: ${subject} | To: ${followup.recipient_email}`,
            occurred_at: new Date().toISOString(),
          });
        }

        sent++;
      } catch (err) {
        console.error("Error processing followup", followup.id, err);
        await supabase
          .from("scheduled_followups")
          .update({ status: "failed" })
          .eq("id", followup.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ processed: followups.length, sent, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-followups error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
