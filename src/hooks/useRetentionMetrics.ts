import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, subDays } from "date-fns";

export interface RetentionMetrics {
  repeatCustomerRate: number;
  repeatCustomers: number;
  totalCustomers: number;
  reviewsCollected: number;
  avgRating: number;
  pendingReviews: number;
  rebookingCandidates: number;
  monthlyRevenue: number;
  prevMonthRevenue: number;
  revenueTrend: number;
  activeAutomations: number;
  followupsSent: number;
}

export function useRetentionMetrics() {
  return useQuery({
    queryKey: ["retention-metrics"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const prevMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
      const thirtyDaysAgo = subDays(now, 30).toISOString();

      const [
        bookingsRes,
        reviewsRes,
        rebookRes,
        revenueRes,
        prevRevenueRes,
        automationsRes,
        followupsRes,
      ] = await Promise.all([
        // All bookings with customer emails for repeat detection
        supabase
          .from("bookings")
          .select("id, customer_email, lead_id")
          .not("customer_email", "is", null),

        // Reviews this month
        supabase
          .from("reviews")
          .select("id, rating, is_public")
          .gte("created_at", monthStart),

        // Completed bookings 30+ days ago (rebooking candidates)
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed")
          .lte("end_datetime", thirtyDaysAgo),

        // This month revenue
        supabase
          .from("daily_metrics")
          .select("revenue")
          .gte("metric_date", monthStart.split("T")[0]),

        // Previous month revenue
        supabase
          .from("daily_metrics")
          .select("revenue")
          .gte("metric_date", prevMonthStart.split("T")[0])
          .lt("metric_date", monthStart.split("T")[0]),

        // Active automation rules
        supabase
          .from("automation_rules")
          .select("id", { count: "exact", head: true })
          .eq("enabled", true),

        // Follow-ups sent this month
        supabase
          .from("contact_activities")
          .select("id", { count: "exact", head: true })
          .in("activity_type", ["email_sent", "followup_sent", "automation_executed"])
          .gte("created_at", monthStart),
      ]);

      // Repeat customer calculation
      const emailCounts = new Map<string, number>();
      for (const b of bookingsRes.data ?? []) {
        if (b.customer_email) {
          emailCounts.set(b.customer_email, (emailCounts.get(b.customer_email) ?? 0) + 1);
        }
      }
      const totalCustomers = emailCounts.size;
      const repeatCustomers = [...emailCounts.values()].filter((c) => c > 1).length;
      const repeatCustomerRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

      // Reviews
      const reviews = reviewsRes.data ?? [];
      const reviewsCollected = reviews.length;
      const avgRating = reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length) * 10) / 10
        : 0;
      const pendingReviews = reviews.filter((r) => !r.is_public).length;

      // Revenue
      const monthlyRevenue = (revenueRes.data ?? []).reduce((s, r) => s + Number(r.revenue ?? 0), 0);
      const prevMonthRevenue = (prevRevenueRes.data ?? []).reduce((s, r) => s + Number(r.revenue ?? 0), 0);
      const revenueTrend = prevMonthRevenue > 0
        ? Math.round(((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
        : monthlyRevenue > 0 ? 100 : 0;

      return {
        repeatCustomerRate,
        repeatCustomers,
        totalCustomers,
        reviewsCollected,
        avgRating,
        pendingReviews,
        rebookingCandidates: rebookRes.count ?? 0,
        monthlyRevenue: Math.round(monthlyRevenue),
        prevMonthRevenue: Math.round(prevMonthRevenue),
        revenueTrend,
        activeAutomations: automationsRes.count ?? 0,
        followupsSent: followupsRes.count ?? 0,
      } satisfies RetentionMetrics;
    },
    refetchInterval: 120_000,
  });
}
