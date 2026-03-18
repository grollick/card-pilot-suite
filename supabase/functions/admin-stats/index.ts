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
    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin role using service role client
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleRow } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Gather platform-wide stats using service role (bypasses RLS) ──

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString();

    // 1. Total users & signups
    const { count: totalUsers } = await serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true });

    const { count: signups30d } = await serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo);

    const { count: signups7d } = await serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo);

    const { count: signupsPrev30d } = await serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sixtyDaysAgo)
      .lt("created_at", thirtyDaysAgo);

    // 2. Plan breakdown
    const { data: planRows } = await serviceClient
      .from("profiles")
      .select("plan");

    const planCounts: Record<string, number> = {};
    for (const row of planRows || []) {
      const plan = (row as any).plan || "starter";
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    }

    // 3. Cards
    const { count: totalCards } = await serviceClient
      .from("cards")
      .select("id", { count: "exact", head: true });

    const { count: publishedCards } = await serviceClient
      .from("cards")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");

    // 4. Card views (from daily_metrics aggregate)
    const { data: viewRows } = await serviceClient
      .from("daily_metrics")
      .select("card_views")
      .gte("metric_date", thirtyDaysAgo.slice(0, 10));

    const totalCardViews30d = (viewRows || []).reduce(
      (sum: number, r: any) => sum + (r.card_views || 0),
      0
    );

    // 5. Leads (30d)
    const { count: leads30d } = await serviceClient
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo);

    // 6. Bookings (30d)
    const { count: bookings30d } = await serviceClient
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo);

    // 7. Recent signups (last 20)
    const { data: recentSignups } = await serviceClient
      .from("profiles")
      .select("id, name, email, plan, created_at, handle")
      .order("created_at", { ascending: false })
      .limit(20);

    // 8. Daily signup trend (last 30 days)
    const { data: allProfiles } = await serviceClient
      .from("profiles")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo);

    const signupsByDate: Record<string, number> = {};
    for (const p of allProfiles || []) {
      const date = (p as any).created_at?.slice(0, 10);
      if (date) signupsByDate[date] = (signupsByDate[date] || 0) + 1;
    }

    const response = {
      totalUsers: totalUsers || 0,
      signups30d: signups30d || 0,
      signups7d: signups7d || 0,
      signupsPrev30d: signupsPrev30d || 0,
      planCounts,
      totalCards: totalCards || 0,
      publishedCards: publishedCards || 0,
      totalCardViews30d,
      leads30d: leads30d || 0,
      bookings30d: bookings30d || 0,
      recentSignups: recentSignups || [],
      signupsByDate,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-stats error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
