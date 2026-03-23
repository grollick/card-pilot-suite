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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Use service role for cross-user lookups
    const sb = createClient(supabaseUrl, serviceKey);

    const { action } = await req.json();

    if (action === "check_activation") {
      // Check if this user's referral can be activated
      const { data: result, error } = await sb.rpc("check_referral_activation", {
        p_user_id: user.id,
      });
      if (error) throw error;

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "record_signup") {
      // Called after signup to create a referral record
      const referredBy = user.user_metadata?.referred_by;
      if (!referredBy) {
        return new Response(JSON.stringify({ status: "no_referrer" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Store referred_by on profile
      await sb.from("profiles").update({ referred_by: referredBy }).eq("id", user.id);

      // Find referrer
      const { data: referrer } = await sb
        .from("profiles")
        .select("id")
        .eq("referral_code", referredBy)
        .single();

      if (!referrer) {
        return new Response(JSON.stringify({ status: "referrer_not_found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fraud checks
      const fraudFlags: string[] = [];

      // Check: same email domain (self-referral prevention)
      const { data: referrerProfile } = await sb
        .from("profiles")
        .select("email")
        .eq("id", referrer.id)
        .single();

      if (referrerProfile?.email) {
        const referrerDomain = referrerProfile.email.split("@")[1];
        const referredDomain = user.email?.split("@")[1];
        if (referrerDomain === referredDomain && !["gmail.com", "outlook.com", "yahoo.com", "hotmail.com", "icloud.com"].includes(referrerDomain || "")) {
          fraudFlags.push("same_custom_domain");
        }
      }

      // Check: referrer already has too many pending referrals (rate limit)
      const { count } = await sb
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referrer_id", referrer.id)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if ((count ?? 0) >= 10) {
        fraudFlags.push("high_velocity");
      }

      // Check: self-referral
      if (referrer.id === user.id) {
        return new Response(JSON.stringify({ status: "self_referral_blocked" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create referral record (even with fraud flags, we track but may not reward)
      const { error: insertError } = await sb.from("referrals").insert({
        referrer_id: referrer.id,
        referred_email: user.email || "",
        referred_user_id: user.id,
        referral_code: referredBy,
        status: fraudFlags.length > 0 ? "flagged" : "pending",
        fraud_flags: fraudFlags,
      });

      if (insertError && !insertError.message.includes("duplicate")) {
        throw insertError;
      }

      return new Response(
        JSON.stringify({ status: "recorded", fraud_flags: fraudFlags }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_stats") {
      // Get referral stats for dashboard
      const { data: referrals } = await sb
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      const all = referrals ?? [];
      const pending = all.filter(r => r.status === "pending");
      const completed = all.filter(r => r.status === "completed");
      const flagged = all.filter(r => r.status === "flagged");
      const totalRewardDays = completed.reduce((sum, r) => sum + (r.reward_days || 0), 0);

      return new Response(
        JSON.stringify({
          total: all.length,
          pending: pending.length,
          completed: completed.length,
          flagged: flagged.length,
          total_reward_days: totalRewardDays,
          referrals: all,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Unknown action");
  } catch (e) {
    console.error("referral-system error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
