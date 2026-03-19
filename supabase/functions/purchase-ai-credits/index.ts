import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Credit pack options
const CREDIT_PACKS = [
  { id: "pack_25", credits: 25, price_cents: 499, label: "25 credits — $4.99" },
  { id: "pack_50", credits: 50, price_cents: 899, label: "50 credits — $8.99" },
  { id: "pack_200", credits: 200, price_cents: 2999, label: "200 credits — $29.99" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, pack_id } = await req.json();

    // GET available packs
    if (action === "get_packs") {
      // Also return current bonus credits
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      const { data: credits } = await supabaseAdmin
        .from("ai_credit_purchases")
        .select("credits_remaining")
        .eq("user_id", user.id)
        .gt("credits_remaining", 0)
        .gte("expires_at", new Date().toISOString());

      const totalBonus = (credits || []).reduce(
        (sum: number, r: any) => sum + r.credits_remaining, 0
      );

      return new Response(
        JSON.stringify({ packs: CREDIT_PACKS, bonus_credits: totalBonus }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PURCHASE a pack
    if (action === "purchase") {
      const pack = CREDIT_PACKS.find((p) => p.id === pack_id);
      if (!pack) {
        return new Response(
          JSON.stringify({ error: "Invalid pack" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // TODO: Integrate Stripe payment here
      // For now, check for STRIPE_SECRET_KEY and create a checkout session
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) {
        return new Response(
          JSON.stringify({ 
            error: "Payment processing not configured yet",
            code: "STRIPE_NOT_CONFIGURED" 
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // When Stripe is configured, create a checkout session here
      // and return the checkout URL. On webhook success, insert the credits.
      // For now return a placeholder:
      return new Response(
        JSON.stringify({ 
          error: "Stripe checkout not yet implemented",
          code: "STRIPE_NOT_CONFIGURED"
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // FULFILL — called by webhook after successful payment
    if (action === "fulfill") {
      // This will be called internally by a Stripe webhook handler
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      const { credits, payment_intent_id, amount_paid } = await req.json();

      if (!credits || !payment_intent_id) {
        return new Response(
          JSON.stringify({ error: "Missing fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Idempotency: check if already fulfilled
      const { data: existing } = await supabaseAdmin
        .from("ai_credit_purchases")
        .select("id")
        .eq("stripe_payment_intent_id", payment_intent_id)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ status: "already_fulfilled" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: insertError } = await supabaseAdmin
        .from("ai_credit_purchases")
        .insert({
          user_id: user.id,
          credits_purchased: credits,
          credits_remaining: credits,
          purchase_type: "topup",
          stripe_payment_intent_id: payment_intent_id,
          amount_paid: amount_paid || 0,
        });

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ status: "fulfilled", credits }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("purchase-ai-credits error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
