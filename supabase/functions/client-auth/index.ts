import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, action } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "send-magic-link") {
      // Rate limit: max 3 magic links per email per hour
      const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
      const { count } = await serviceClient
        .from("email_send_log")
        .select("id", { count: "exact", head: true })
        .eq("recipient_email", email)
        .eq("template_name", "magic_link")
        .gte("created_at", oneHourAgo);

      if ((count ?? 0) >= 3) {
        // Silent success to prevent enumeration
        return new Response(
          JSON.stringify({ success: true, message: "If an account exists, a login link has been sent to your email." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if this email exists as a lead in any business
      const { data: leads } = await serviceClient
        .from("leads")
        .select("id, email")
        .eq("email", email)
        .limit(1);

      if (!leads || leads.length === 0) {
        // Return same response to prevent email enumeration
        console.log("client-auth: no lead found for email, returning generic response");
        return new Response(
          JSON.stringify({ success: true, message: "If an account exists, a login link has been sent to your email." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send magic link via Supabase Auth
      const { error: otpError } = await serviceClient.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${req.headers.get("origin") || Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app")}/client`,
        },
      });

      if (otpError) {
        console.error("OTP error:", otpError);
        return new Response(
          JSON.stringify({ error: "Failed to send login link. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log the send for rate limiting
      await serviceClient.from("email_send_log").insert({
        recipient_email: email,
        template_name: "magic_link",
        status: "sent",
      });

      return new Response(
        JSON.stringify({ success: true, message: "Magic link sent to your email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "setup-profile") {
      // Called after magic link login to ensure client profile exists
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const anonClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = claimsData.claims.sub;
      const userEmail = claimsData.claims.email as string;

      // Get name from leads
      const { data: leadData } = await serviceClient
        .from("leads")
        .select("name, phone")
        .eq("email", userEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Upsert client profile
      const { error: profileError } = await serviceClient
        .from("client_profiles")
        .upsert({
          user_id: userId,
          email: userEmail,
          name: leadData?.name || null,
          phone: leadData?.phone || null,
        }, { onConflict: "user_id" });

      if (profileError) {
        console.error("Profile upsert error:", profileError);
      }

      // Ensure client role
      await serviceClient
        .from("user_roles")
        .upsert({ user_id: userId, role: "client" }, { onConflict: "user_id,role" });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("client-auth error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
