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

    // Parse filters from query string
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30", 10);
    const profession = url.searchParams.get("profession") || null;
    const location = url.searchParams.get("location") || null;

    const now = new Date();
    const since = new Date(now.getTime() - days * 86400000).toISOString();

    // ── Stage 1: Outreach leads (from outreach_contacts)
    const { data: outreachData } = await sc
      .from("outreach_contacts")
      .select("id, name, business, status, created_at")
      .gte("created_at", since);
    const outreachContacts = outreachData || [];

    // ── Stage 2: Replies (outreach contacts with status replied/contacted)
    const replies = outreachContacts.filter((c: any) => 
      c.status === "replied" || c.status === "interested"
    );

    // ── Stage 3: Signups (profiles created in period)
    let signupsQuery = sc
      .from("profiles")
      .select("id, name, email, profession, city, created_at, onboarding_completed, handle")
      .gte("created_at", since);
    
    if (profession) {
      signupsQuery = signupsQuery.eq("profession", profession);
    }
    if (location) {
      signupsQuery = signupsQuery.ilike("city", `%${location}%`);
    }

    const { data: signups } = await signupsQuery;
    const signupList = signups || [];

    // ── Stage 4: Activated (onboarding_completed = true)
    const activated = signupList.filter((p: any) => p.onboarding_completed === true);

    // ── Stage 5: First Lead (users who received at least one lead)
    const activatedIds = activated.map((p: any) => p.id);
    let usersWithLeads: any[] = [];
    if (activatedIds.length > 0) {
      const { data: leadData } = await sc
        .from("leads")
        .select("user_id")
        .in("user_id", activatedIds.slice(0, 500));
      const leadUserIds = new Set((leadData || []).map((l: any) => l.user_id));
      usersWithLeads = activated.filter((p: any) => leadUserIds.has(p.id));
    }

    // ── Stage 6: First Response (users who responded to estimate matches)
    let usersWithResponses: any[] = [];
    if (usersWithLeads.length > 0) {
      const leadUserIds = usersWithLeads.map((p: any) => p.id);
      const { data: matchData } = await sc
        .from("estimate_matches")
        .select("user_id, responded_at")
        .in("user_id", leadUserIds.slice(0, 500))
        .not("responded_at", "is", null);
      const respondedIds = new Set((matchData || []).map((m: any) => m.user_id));
      usersWithResponses = usersWithLeads.filter((p: any) => respondedIds.has(p.id));
    }

    // ── Stage 7: First Job (users with accepted matches or completed bookings)
    let usersWithJobs: any[] = [];
    if (usersWithResponses.length > 0) {
      const respUserIds = usersWithResponses.map((p: any) => p.id);
      const { data: acceptedData } = await sc
        .from("estimate_matches")
        .select("user_id")
        .in("user_id", respUserIds.slice(0, 500))
        .eq("status", "accepted");
      const { data: bookingData } = await sc
        .from("bookings")
        .select("user_id")
        .in("user_id", respUserIds.slice(0, 500))
        .eq("status", "completed");
      const jobUserIds = new Set([
        ...(acceptedData || []).map((m: any) => m.user_id),
        ...(bookingData || []).map((b: any) => b.user_id),
      ]);
      usersWithJobs = usersWithResponses.filter((p: any) => jobUserIds.has(p.id));
    }

    // Build stages
    const stages = [
      {
        id: "leads",
        label: "Leads",
        count: outreachContacts.length,
        users: outreachContacts.slice(0, 20).map((c: any) => ({
          id: c.id, name: c.name, business: c.business, created_at: c.created_at,
        })),
      },
      {
        id: "replies",
        label: "Replies",
        count: replies.length,
        users: replies.slice(0, 20).map((c: any) => ({
          id: c.id, name: c.name, business: c.business, created_at: c.created_at,
        })),
      },
      {
        id: "signups",
        label: "Signups",
        count: signupList.length,
        users: signupList.slice(0, 20).map((p: any) => ({
          id: p.id, name: p.name || p.email, email: p.email, profession: p.profession, created_at: p.created_at,
        })),
      },
      {
        id: "activated",
        label: "Activated",
        count: activated.length,
        users: activated.slice(0, 20).map((p: any) => ({
          id: p.id, name: p.name || p.email, email: p.email, profession: p.profession, created_at: p.created_at,
        })),
      },
      {
        id: "first_lead",
        label: "First Lead",
        count: usersWithLeads.length,
        users: usersWithLeads.slice(0, 20).map((p: any) => ({
          id: p.id, name: p.name || p.email, email: p.email, created_at: p.created_at,
        })),
      },
      {
        id: "first_response",
        label: "First Response",
        count: usersWithResponses.length,
        users: usersWithResponses.slice(0, 20).map((p: any) => ({
          id: p.id, name: p.name || p.email, email: p.email, created_at: p.created_at,
        })),
      },
      {
        id: "first_job",
        label: "First Job",
        count: usersWithJobs.length,
        users: usersWithJobs.slice(0, 20).map((p: any) => ({
          id: p.id, name: p.name || p.email, email: p.email, created_at: p.created_at,
        })),
      },
    ];

    // Generate insights
    const insights: { type: "warning" | "success" | "info"; message: string; suggestion: string }[] = [];

    for (let i = 1; i < stages.length; i++) {
      const prev = stages[i - 1];
      const curr = stages[i];
      if (prev.count === 0) continue;
      const rate = (curr.count / prev.count) * 100;
      if (rate < 20) {
        insights.push({
          type: "warning",
          message: `High drop-off between ${prev.label} and ${curr.label} (${rate.toFixed(0)}% conversion)`,
          suggestion: getDropoffSuggestion(prev.id, curr.id),
        });
      } else if (rate >= 60) {
        insights.push({
          type: "success",
          message: `Strong conversion from ${prev.label} to ${curr.label} (${rate.toFixed(0)}%)`,
          suggestion: `Keep doing what works at this stage.`,
        });
      }
    }

    return jsonRes({ stages, insights, filters: { days, profession, location } });
  } catch (err) {
    console.error("admin-funnel-stats error:", err);
    return jsonRes({ error: "Internal error" }, 500);
  }
});

function getDropoffSuggestion(fromId: string, toId: string): string {
  const suggestions: Record<string, string> = {
    "leads-replies": "Try personalizing outreach messages or following up faster.",
    "replies-signups": "Simplify the signup flow and highlight value propositions.",
    "signups-activated": "Improve onboarding with guided steps and activation checklist.",
    "activated-first_lead": "Boost marketplace visibility with neighborhood boosts or social sharing.",
    "first_lead-first_response": "Enable push notifications and auto-reminders for new leads.",
    "first_response-first_job": "Add follow-up automation and help users close their first deal.",
  };
  return suggestions[`${fromId}-${toId}`] || "Review this stage for friction points.";
}
