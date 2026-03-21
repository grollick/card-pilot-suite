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

    const body = await req.json();
    const { action, pack_id } = body;

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

      return new Response(
        JSON.stringify({ 
          error: "Stripe checkout not yet implemented",
          code: "STRIPE_NOT_CONFIGURED"
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // NOTE: The "fulfill" action has been removed from this user-facing endpoint.
    // Credit fulfillment must be handled by a dedicated Stripe webhook endpoint
    // that verifies the webhook signature before granting credits.

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
