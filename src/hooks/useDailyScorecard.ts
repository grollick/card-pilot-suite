import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays } from "date-fns";

interface Insight {
  message: string;
  severity: "high" | "medium" | "low";
  action: "follow_up" | "send_message" | "create_task" | "book";
}

interface ScorecardData {
  views: number;
  leads: number;
  bookings: number;
  estimatesSent: number;
  jobsCompleted: number;
  revenue: number;
  followupsNeeded: number;
  insights: Insight[];
  trends: {
    views: number;
    leads: number;
    bookings: number;
    estimates: number;
    jobs: number;
    revenue: number;
  };
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function useDailyScorecard() {
  return useQuery<ScorecardData>({
    queryKey: ["daily-scorecard"],
    queryFn: async () => {
      const now = new Date();
      const yesterdayStart = startOfDay(subDays(now, 1)).toISOString();
      const todayStart = startOfDay(now).toISOString();
      const dayBeforeStart = startOfDay(subDays(now, 2)).toISOString();

      // Fetch yesterday + day-before in parallel for trend comparison
      const [
        { count: views },
        { count: viewsPrev },
        { count: leads },
        { count: leadsPrev },
        { data: bookingsData },
        { data: bookingsPrevData },
        { count: estimatesSent },
        { count: estimatesPrev },
        { count: jobsCompleted },
        { count: jobsPrev },
        { data: services },
        { count: followupsNeeded },
        { count: uncontactedLeads },
        { count: pendingEstimates },
      ] = await Promise.all([
        // Yesterday views
        supabase.from("analytics_events").select("*", { count: "exact", head: true })
          .eq("event_type", "card_view").gte("created_at", yesterdayStart).lt("created_at", todayStart),
        // Day-before views
        supabase.from("analytics_events").select("*", { count: "exact", head: true })
          .eq("event_type", "card_view").gte("created_at", dayBeforeStart).lt("created_at", yesterdayStart),
        // Yesterday leads
        supabase.from("leads").select("*", { count: "exact", head: true })
          .gte("created_at", yesterdayStart).lt("created_at", todayStart),
        // Day-before leads
        supabase.from("leads").select("*", { count: "exact", head: true })
          .gte("created_at", dayBeforeStart).lt("created_at", yesterdayStart),
        // Yesterday bookings
        supabase.from("bookings").select("id").gte("created_at", yesterdayStart).lt("created_at", todayStart),
        // Day-before bookings
        supabase.from("bookings").select("id").gte("created_at", dayBeforeStart).lt("created_at", yesterdayStart),
        // Yesterday estimates sent
        supabase.from("estimates").select("*", { count: "exact", head: true })
          .eq("status", "sent").gte("updated_at", yesterdayStart).lt("updated_at", todayStart),
        // Day-before estimates
        supabase.from("estimates").select("*", { count: "exact", head: true })
          .eq("status", "sent").gte("updated_at", dayBeforeStart).lt("updated_at", yesterdayStart),
        // Yesterday jobs completed
        supabase.from("jobs").select("*", { count: "exact", head: true })
          .eq("status", "completed").gte("updated_at", yesterdayStart).lt("updated_at", todayStart),
        // Day-before jobs
        supabase.from("jobs").select("*", { count: "exact", head: true })
          .eq("status", "completed").gte("updated_at", dayBeforeStart).lt("updated_at", yesterdayStart),
        // Avg service price
        supabase.from("booking_services").select("price").eq("active", true),
        // Open tasks due today or overdue
        supabase.from("tasks").select("*", { count: "exact", head: true })
          .eq("status", "open").lte("due_date", todayStart.split("T")[0]),
        // Leads with no activity
        supabase.from("leads").select("*", { count: "exact", head: true })
          .eq("status", "open").is("last_activity_at", null),
        // Pending estimates
        supabase.from("estimates").select("*", { count: "exact", head: true })
          .eq("status", "sent"),
      ]);

      const bookingCount = bookingsData?.length ?? 0;
      const bookingCountPrev = bookingsPrevData?.length ?? 0;

      const prices = (services ?? []).map(s => s.price ?? 0).filter(p => p > 0);
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      const revenue = Math.round(bookingCount * avgPrice);
      const revenuePrev = Math.round(bookingCountPrev * avgPrice);

      // Build insights
      const insights: Insight[] = [];
      if ((uncontactedLeads ?? 0) > 0) {
        insights.push({
          message: `You have ${uncontactedLeads} lead${(uncontactedLeads ?? 0) > 1 ? "s" : ""} that haven't been contacted.`,
          severity: "high",
          action: "follow_up",
        });
      }
      if ((pendingEstimates ?? 0) > 0) {
        insights.push({
          message: `${pendingEstimates} estimate${(pendingEstimates ?? 0) > 1 ? "s were" : " was"} sent but not yet approved.`,
          severity: "medium",
          action: "send_message",
        });
      }
      if ((followupsNeeded ?? 0) > 0) {
        insights.push({
          message: `${followupsNeeded} task${(followupsNeeded ?? 0) > 1 ? "s" : ""} overdue or due today.`,
          severity: "medium",
          action: "create_task",
        });
      }

      return {
        views: views ?? 0,
        leads: leads ?? 0,
        bookings: bookingCount,
        estimatesSent: estimatesSent ?? 0,
        jobsCompleted: jobsCompleted ?? 0,
        revenue,
        followupsNeeded: followupsNeeded ?? 0,
        insights,
        trends: {
          views: pctChange(views ?? 0, viewsPrev ?? 0),
          leads: pctChange(leads ?? 0, leadsPrev ?? 0),
          bookings: pctChange(bookingCount, bookingCountPrev),
          estimates: pctChange(estimatesSent ?? 0, estimatesPrev ?? 0),
          jobs: pctChange(jobsCompleted ?? 0, jobsPrev ?? 0),
          revenue: pctChange(revenue, revenuePrev),
        },
      };
    },
    refetchInterval: 120_000,
  });
}
