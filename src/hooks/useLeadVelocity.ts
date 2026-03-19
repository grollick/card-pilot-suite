import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, startOfWeek, differenceInMinutes } from "date-fns";

export interface VelocityMultiplier {
  key: string;
  label: string;
  description: string;
  value: number;
  active: boolean;
}

export interface WeeklyGoal {
  current: number;
  target: number;
  progress: number;
}

export interface LeadVelocityData {
  /** Composite velocity score 0–200 (100 = baseline) */
  velocityScore: number;
  /** Leads this week */
  leadsThisWeek: number;
  /** Leads last week for comparison */
  leadsLastWeek: number;
  /** Week-over-week trend percentage */
  weekOverWeekTrend: number;
  /** Weekly goal tracking */
  weeklyGoal: WeeklyGoal;
  /** Active multipliers affecting visibility */
  multipliers: VelocityMultiplier[];
  /** Actionable recommendations */
  recommendations: { icon: string; text: string; priority: "high" | "medium" | "low" }[];
  /** Profile freshness boost active */
  profileBoostActive: boolean;
  /** Total multiplier value for marketplace ranking */
  totalBoost: number;
}

export function useLeadVelocity() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["lead-velocity", user?.id],
    enabled: !!user,
    refetchInterval: 120_000,
    queryFn: async (): Promise<LeadVelocityData> => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const lastWeekStart = subDays(startOfWeek(now, { weekStartsOn: 1 }), 7).toISOString();
      const lastWeekEnd = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const thirtyDaysAgo = subDays(now, 30).toISOString();
      const sevenDaysAgo = subDays(now, 7).toISOString();
      const threeDaysAgo = subDays(now, 3).toISOString();

      const [
        leadsThisWeekRes,
        leadsLastWeekRes,
        profileRes,
        routingRes,
        cardViewsRes,
        closedLeadsRes,
        cardUpdatedRes,
      ] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", weekStart),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", lastWeekStart).lt("created_at", lastWeekEnd),
        supabase.from("profiles").select("updated_at, available_for_work, avg_response_minutes, onboarding_completed").eq("id", user!.id).single(),
        supabase.from("lead_routing_log" as any).select("responded_at, delivered_at").gte("delivered_at", thirtyDaysAgo),
        supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "card_view").gte("created_at", sevenDaysAgo),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "won").gte("updated_at", thirtyDaysAgo),
        supabase.from("cards").select("updated_at").order("updated_at", { ascending: false }).limit(1),
      ]);

      const leadsThisWeek = leadsThisWeekRes.count ?? 0;
      const leadsLastWeek = leadsLastWeekRes.count ?? 0;
      const profile = profileRes.data;
      const routingLogs = (routingRes.data ?? []) as any[];
      const cardViews = cardViewsRes.count ?? 0;
      const closedLeads = closedLeadsRes.count ?? 0;
      const cardLastUpdated = cardUpdatedRes.data?.[0]?.updated_at;

      // WoW trend
      const weekOverWeekTrend = leadsLastWeek > 0
        ? Math.round(((leadsThisWeek - leadsLastWeek) / leadsLastWeek) * 100)
        : leadsThisWeek > 0 ? 100 : 0;

      // Weekly goal: adaptive — aim for 10% more than last week, minimum 3
      const weeklyTarget = Math.max(3, Math.ceil((leadsLastWeek || 2) * 1.1));
      const weeklyGoal: WeeklyGoal = {
        current: leadsThisWeek,
        target: weeklyTarget,
        progress: Math.min(Math.round((leadsThisWeek / weeklyTarget) * 100), 100),
      };

      // ── Compute multipliers ──
      const multipliers: VelocityMultiplier[] = [];

      // 1. Fast responder boost
      let avgResponseMin = profile?.avg_response_minutes ?? 999;
      if (routingLogs.length > 0) {
        const responded = routingLogs.filter((r) => r.responded_at);
        if (responded.length > 0) {
          const totalMin = responded.reduce((sum: number, r: any) => {
            return sum + differenceInMinutes(new Date(r.responded_at), new Date(r.delivered_at));
          }, 0);
          avgResponseMin = Math.round(totalMin / responded.length);
        }
      }
      const fastResponder = avgResponseMin < 60;
      multipliers.push({
        key: "fast_response",
        label: "Fast Responder",
        description: `Avg response: ${avgResponseMin < 60 ? `${avgResponseMin}m` : `${Math.round(avgResponseMin / 60)}h`}`,
        value: fastResponder ? 1.3 : avgResponseMin < 240 ? 1.1 : 1.0,
        active: fastResponder || avgResponseMin < 240,
      });

      // 2. Profile freshness boost (updated in last 3 days)
      const profileUpdatedRecently = profile?.updated_at
        ? new Date(profile.updated_at) > new Date(threeDaysAgo)
        : false;
      multipliers.push({
        key: "profile_fresh",
        label: "Profile Boost",
        description: profileUpdatedRecently ? "Profile updated recently" : "Update your profile for a boost",
        value: profileUpdatedRecently ? 1.2 : 1.0,
        active: profileUpdatedRecently,
      });

      // 3. Card freshness boost (card updated in last 7 days)
      const cardUpdatedRecently = cardLastUpdated
        ? new Date(cardLastUpdated) > new Date(sevenDaysAgo)
        : false;
      multipliers.push({
        key: "card_fresh",
        label: "Card Update Boost",
        description: cardUpdatedRecently ? "Card recently updated" : "Update your card for a visibility bump",
        value: cardUpdatedRecently ? 1.15 : 1.0,
        active: cardUpdatedRecently,
      });

      // 4. Closer boost (closed leads in 30 days)
      const closerBoost = closedLeads >= 3;
      multipliers.push({
        key: "closer",
        label: "Lead Closer",
        description: `${closedLeads} leads closed in 30 days`,
        value: closerBoost ? 1.25 : closedLeads >= 1 ? 1.1 : 1.0,
        active: closerBoost || closedLeads >= 1,
      });

      // 5. Sharing multiplier (card views this week)
      const sharingActive = cardViews >= 10;
      multipliers.push({
        key: "sharing",
        label: "Active Sharer",
        description: `${cardViews} card views this week`,
        value: sharingActive ? 1.2 : cardViews >= 3 ? 1.1 : 1.0,
        active: sharingActive || cardViews >= 3,
      });

      // Total boost multiplier
      const totalBoost = multipliers.reduce((product, m) => product * m.value, 1);

      // Velocity score: baseline 100, scaled by multipliers and trend
      const trendFactor = weekOverWeekTrend > 0 ? 1 + (weekOverWeekTrend / 200) : 1 + (weekOverWeekTrend / 400);
      const velocityScore = Math.round(100 * totalBoost * trendFactor);

      // ── Recommendations ──
      const recommendations: { icon: string; text: string; priority: "high" | "medium" | "low" }[] = [];

      if (!fastResponder) {
        recommendations.push({
          icon: "⚡",
          text: "Respond to leads within 1 hour to get a 30% visibility boost",
          priority: "high",
        });
      }
      if (!profileUpdatedRecently) {
        recommendations.push({
          icon: "✏️",
          text: "Update your profile to activate a 20% temporary visibility boost",
          priority: "medium",
        });
      }
      if (!cardUpdatedRecently) {
        recommendations.push({
          icon: "🃏",
          text: "Refresh your card content for a 15% ranking boost",
          priority: "medium",
        });
      }
      if (cardViews < 10) {
        recommendations.push({
          icon: "📤",
          text: `Share your card more — ${10 - cardViews} more views to unlock the sharing multiplier`,
          priority: "medium",
        });
      }
      if (closedLeads < 3) {
        recommendations.push({
          icon: "🎯",
          text: `Close ${3 - closedLeads} more leads to activate the Closer boost`,
          priority: "low",
        });
      }
      if (weeklyGoal.progress < 50) {
        recommendations.push({
          icon: "📊",
          text: `You're at ${weeklyGoal.progress}% of your weekly lead goal — share your card to catch up`,
          priority: "high",
        });
      }

      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      return {
        velocityScore,
        leadsThisWeek,
        leadsLastWeek,
        weekOverWeekTrend,
        weeklyGoal,
        multipliers,
        recommendations: recommendations.slice(0, 4),
        profileBoostActive: profileUpdatedRecently,
        totalBoost,
      };
    },
  });
}
