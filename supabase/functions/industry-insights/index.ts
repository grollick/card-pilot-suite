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
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth client to get user
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader! } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for aggregated queries across all users
    const admin = createClient(supabaseUrl, serviceKey);

    // Get user's profession
    const { data: profile } = await authClient.from("profiles").select("profession_id, company").eq("id", user.id).single();
    if (!profile?.profession_id) {
      return new Response(JSON.stringify({
        error: null,
        insights: null,
        message: "Complete onboarding to see industry insights",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get profession info
    const { data: profession } = await admin.from("professions").select("name, category").eq("id", profile.profession_id).single();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get all user IDs in the same profession (for aggregation)
    const { data: peerProfiles } = await admin
      .from("profiles")
      .select("id")
      .eq("profession_id", profile.profession_id);

    const peerIds = (peerProfiles ?? []).map(p => p.id);
    const peerCount = peerIds.length;

    if (peerCount < 2) {
      return new Response(JSON.stringify({
        insights: {
          professionName: profession?.name ?? "Your Industry",
          peerCount,
          message: "Not enough businesses in your industry yet for benchmarks.",
          benchmarks: null,
          trends: null,
          marketing: null,
          userComparison: null,
        },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Aggregate job data across peers ──
    const { data: allJobs } = await admin
      .from("jobs")
      .select("user_id, status, created_at, job_type")
      .in("user_id", peerIds)
      .gte("created_at", thirtyDaysAgo);

    // ── Aggregate estimate data ──
    const { data: allEstimates } = await admin
      .from("estimates")
      .select("user_id, status, grand_total, created_at")
      .in("user_id", peerIds)
      .gte("created_at", thirtyDaysAgo);

    // ── Aggregate booking data ──
    const { data: allBookings } = await admin
      .from("bookings")
      .select("user_id, status, start_datetime, created_at, service_id")
      .in("user_id", peerIds)
      .gte("created_at", thirtyDaysAgo);

    // ── Aggregate lead data ──
    const { data: allLeads } = await admin
      .from("leads")
      .select("user_id, status, source, created_at")
      .in("user_id", peerIds)
      .gte("created_at", thirtyDaysAgo);

    // ── Aggregate analytics events ──
    const { data: allEvents } = await admin
      .from("analytics_events")
      .select("user_id, event_type, created_at, meta_json")
      .in("user_id", peerIds)
      .gte("created_at", sevenDaysAgo)
      .limit(1000);

    // ── Aggregate booking services for trending ──
    const { data: allServices } = await admin
      .from("booking_services")
      .select("name, user_id")
      .in("user_id", peerIds)
      .eq("active", true);

    const jobs = allJobs ?? [];
    const estimates = allEstimates ?? [];
    const bookings = allBookings ?? [];
    const leads = allLeads ?? [];
    const events = allEvents ?? [];
    const services = allServices ?? [];

    // ── Pricing benchmarks ──
    const approvedEstimates = estimates.filter(e => e.status === "approved" || e.status === "sent");
    const totals = approvedEstimates.map(e => Number(e.grand_total)).filter(t => t > 0);
    totals.sort((a, b) => a - b);
    const avgJobValue = totals.length > 0 ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : 0;
    const p25 = totals.length > 3 ? totals[Math.floor(totals.length * 0.25)] : (totals[0] ?? 0);
    const p75 = totals.length > 3 ? totals[Math.floor(totals.length * 0.75)] : (totals[totals.length - 1] ?? 0);

    // ── Trending services ──
    const serviceCounts: Record<string, number> = {};
    services.forEach(s => { serviceCounts[s.name] = (serviceCounts[s.name] || 0) + 1; });
    const trendingServices = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, popularity: Math.round((count / peerCount) * 100) }));

    // ── Best booking times ──
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};
    bookings.forEach(b => {
      const d = new Date(b.start_datetime);
      hourCounts[d.getHours()] = (hourCounts[d.getHours()] || 0) + 1;
      dayCounts[d.getDay()] = (dayCounts[d.getDay()] || 0) + 1;
    });
    const bestHour = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    const bestDay = Object.entries(dayCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // ── Lead sources ──
    const sourceCounts: Record<string, number> = {};
    leads.forEach(l => { sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1; });
    const topSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({ source, count, pct: Math.round((count / leads.length) * 100) }));

    // ── Marketing: best day to post ──
    const clicksByDay: Record<number, number> = {};
    events.filter(e => e.event_type === "button_click").forEach(e => {
      const d = new Date(e.created_at).getDay();
      clicksByDay[d] = (clicksByDay[d] || 0) + 1;
    });
    const bestPostDay = Object.entries(clicksByDay).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

    // ── Industry averages ──
    const industryLeadConversion = leads.length > 0
      ? Math.round((leads.filter(l => l.status === "won" || l.status === "converted").length / leads.length) * 100)
      : 0;
    const industryBookingRate = leads.length > 0
      ? Math.round((bookings.length / leads.length) * 100)
      : 0;
    const industryEstimateApproval = estimates.length > 0
      ? Math.round((estimates.filter(e => e.status === "approved").length / estimates.length) * 100)
      : 0;

    // ── User's own stats for comparison ──
    const userJobs = jobs.filter(j => j.user_id === user.id);
    const userEstimates = estimates.filter(e => e.user_id === user.id);
    const userBookings = bookings.filter(b => b.user_id === user.id);
    const userLeads = leads.filter(l => l.user_id === user.id);

    const userLeadConversion = userLeads.length > 0
      ? Math.round((userLeads.filter(l => l.status === "won" || l.status === "converted").length / userLeads.length) * 100)
      : 0;
    const userBookingRate = userLeads.length > 0
      ? Math.round((userBookings.length / userLeads.length) * 100)
      : 0;
    const userEstimateApproval = userEstimates.length > 0
      ? Math.round((userEstimates.filter(e => e.status === "approved").length / userEstimates.length) * 100)
      : 0;
    const userTotals = userEstimates.filter(e => e.status === "approved" || e.status === "sent").map(e => Number(e.grand_total)).filter(t => t > 0);
    const userAvgJobValue = userTotals.length > 0 ? Math.round(userTotals.reduce((a, b) => a + b, 0) / userTotals.length) : 0;

    // ── Lead conversion trend (weekly) ──
    const weeklyTrend: { week: string; leads: number; converted: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekLeads = leads.filter(l => new Date(l.created_at) >= weekStart && new Date(l.created_at) < weekEnd);
      weeklyTrend.push({
        week: `Week ${4 - i}`,
        leads: weekLeads.length,
        converted: weekLeads.filter(l => l.status === "won" || l.status === "converted").length,
      });
    }

    return new Response(JSON.stringify({
      insights: {
        professionName: profession?.name ?? "Your Industry",
        peerCount,
        benchmarks: {
          avgJobValue,
          lowRange: Math.round(p25),
          highRange: Math.round(p75),
          totalEstimates: totals.length,
        },
        trendingServices,
        bestTimes: {
          bestBookingHour: bestHour ? `${Number(bestHour[0]) > 12 ? Number(bestHour[0]) - 12 : bestHour[0]}${Number(bestHour[0]) >= 12 ? "pm" : "am"}` : null,
          bestBookingDay: bestDay ? dayNames[Number(bestDay[0])] : null,
          bestPostDay: bestPostDay ? dayNames[Number(bestPostDay[0])] : null,
        },
        topSources,
        industryAverages: {
          leadConversion: industryLeadConversion,
          bookingRate: industryBookingRate,
          estimateApproval: industryEstimateApproval,
          avgJobValue,
        },
        userComparison: {
          leadConversion: userLeadConversion,
          bookingRate: userBookingRate,
          estimateApproval: userEstimateApproval,
          avgJobValue: userAvgJobValue,
        },
        weeklyTrend,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("industry-insights error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
