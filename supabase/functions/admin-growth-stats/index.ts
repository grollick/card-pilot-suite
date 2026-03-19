import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonRes({ error: "Unauthorized" }, 401);

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return jsonRes({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub;

    const sc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Admin check
    const { data: roleRow } = await sc
      .from("user_roles").select("role")
      .eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) return jsonRes({ error: "Forbidden" }, 403);

    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();

    // ── KPIs ──
    const [
      { count: newUsers7d },
      { count: totalUsers },
      { data: allProfiles },
      { count: leads30d },
      { count: totalLeads },
      { count: jobRequests30d },
      { count: totalJobRequests },
      { count: totalCards },
      { count: publishedCards },
      { data: matchRows },
      { count: onDutyCount },
      { data: recentProfiles },
      { data: recentRequests },
      { data: recentMatches },
    ] = await Promise.all([
      sc.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", d7),
      sc.from("profiles").select("id", { count: "exact", head: true }),
      sc.from("profiles").select("created_at, plan, handle, name, email, onboarding_completed"),
      sc.from("leads").select("id", { count: "exact", head: true }).gte("created_at", d30),
      sc.from("leads").select("id", { count: "exact", head: true }),
      sc.from("estimate_requests").select("id", { count: "exact", head: true }).gte("created_at", d30),
      sc.from("estimate_requests").select("id", { count: "exact", head: true }),
      sc.from("cards").select("id", { count: "exact", head: true }),
      sc.from("cards").select("id", { count: "exact", head: true }).eq("status", "published"),
      sc.from("estimate_matches").select("status, responded_at"),
      sc.from("estimate_duty_status").select("id", { count: "exact", head: true }).eq("is_on_duty", true),
      sc.from("profiles").select("id, name, email, plan, created_at, handle").order("created_at", { ascending: false }).limit(15),
      sc.from("estimate_requests").select("id, requester_name, service_needed, status, created_at").order("created_at", { ascending: false }).limit(10),
      sc.from("estimate_matches").select("id, status, created_at, match_score").order("created_at", { ascending: false }).limit(10),
    ]);

    // Activated = onboarding_completed OR has published card
    const profiles = allProfiles || [];
    const activatedCount = profiles.filter((p: any) => p.onboarding_completed === true).length;

    // Response rate
    const matches = matchRows || [];
    const respondedCount = matches.filter((m: any) => m.responded_at !== null).length;
    const responseRate = matches.length > 0 ? Math.round((respondedCount / matches.length) * 100) : 0;

    // Funnel: signups30d, activated, leads, wins
    const signups30d = profiles.filter((p: any) => new Date(p.created_at) >= new Date(d30)).length;
    const activated30d = profiles.filter((p: any) => 
      new Date(p.created_at) >= new Date(d30) && p.onboarding_completed === true
    ).length;
    const wins = matches.filter((m: any) => m.status === "accepted").length;

    // Signup trend (daily, last 30d)
    const signupsByDate: Record<string, number> = {};
    for (const p of profiles) {
      const d = (p as any).created_at?.slice(0, 10);
      if (d && new Date(d) >= new Date(d30.slice(0, 10))) {
        signupsByDate[d] = (signupsByDate[d] || 0) + 1;
      }
    }

    // Plan breakdown
    const planCounts: Record<string, number> = {};
    for (const p of profiles) {
      const plan = (p as any).plan || "starter";
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    }

    // Activity feed
    const activityFeed = [
      ...(recentProfiles || []).map((p: any) => ({
        type: "signup",
        title: `${p.name || p.email || "New user"} signed up`,
        timestamp: p.created_at,
        meta: { plan: p.plan, handle: p.handle },
      })),
      ...(recentRequests || []).map((r: any) => ({
        type: "job_request",
        title: `${r.requester_name} requested ${r.service_needed || "a service"}`,
        timestamp: r.created_at,
        meta: { status: r.status },
      })),
      ...(recentMatches || []).map((m: any) => ({
        type: "response",
        title: `Match ${m.status} (score: ${m.match_score})`,
        timestamp: m.created_at,
        meta: { status: m.status },
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);

    return jsonRes({
      kpis: {
        newUsers7d: newUsers7d || 0,
        activatedUsers: activatedCount,
        totalUsers: totalUsers || 0,
        leads30d: leads30d || 0,
        totalLeads: totalLeads || 0,
        jobRequests30d: jobRequests30d || 0,
        totalJobRequests: totalJobRequests || 0,
        responseRate,
      },
      funnel: {
        outreach: 0, // manual tracking via outreach_contacts
        signups: signups30d,
        activated: activated30d,
        leads: leads30d || 0,
        wins,
      },
      marketplace: {
        activeBusinesses: publishedCards || 0,
        onDutyUsers: onDutyCount || 0,
        totalRequests: totalJobRequests || 0,
        avgResponses: matches.length > 0 ? Math.round(matches.length / Math.max(totalJobRequests || 1, 1)) : 0,
      },
      signupsByDate,
      planCounts,
      activityFeed,
    });
  } catch (err) {
    console.error("admin-growth-stats error:", err);
    return jsonRes({ error: "Internal error" }, 500);
  }
});
