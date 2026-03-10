import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths } from "date-fns";

export function useBusinessPerformance() {
  return useQuery({
    queryKey: ["business-performance"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const prevMonthStart = startOfMonth(subMonths(now, 1)).toISOString();

      const [viewsRes, leadsRes, bookingsRes, servicesRes, prevViewsRes, prevLeadsRes, prevBookingsRes] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("event_type", "card_view")
          .gte("created_at", monthStart),
        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .gte("created_at", monthStart),
        supabase
          .from("bookings")
          .select("id, service_id")
          .gte("created_at", monthStart),
        supabase
          .from("booking_services")
          .select("price")
          .eq("active", true),
        // Previous month for trend calculation
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("event_type", "card_view")
          .gte("created_at", prevMonthStart)
          .lt("created_at", monthStart),
        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .gte("created_at", prevMonthStart)
          .lt("created_at", monthStart),
        supabase
          .from("bookings")
          .select("id")
          .gte("created_at", prevMonthStart)
          .lt("created_at", monthStart),
      ]);

      const bookingCount = bookingsRes.data?.length ?? 0;
      const prices = (servicesRes.data ?? []).map(s => s.price ?? 0).filter(p => p > 0);
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

      const estimatedRevenue = Math.round(bookingCount * avgPrice);
      const viewsThisMonth = viewsRes.count ?? 0;
      const leadsThisMonth = leadsRes.count ?? 0;
      const conversionRate = viewsThisMonth > 0
        ? Math.round((leadsThisMonth / viewsThisMonth) * 100)
        : 0;

      // Trend calculations (percentage change vs previous month)
      const prevViews = prevViewsRes.count ?? 0;
      const prevLeads = prevLeadsRes.count ?? 0;
      const prevBookings = prevBookingsRes.data?.length ?? 0;
      const prevRevenue = Math.round(prevBookings * avgPrice);

      const calcTrend = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      return {
        views: viewsThisMonth,
        leads: leadsThisMonth,
        bookings: bookingCount,
        estimatedRevenue,
        conversionRate,
        avgPrice: Math.round(avgPrice),
        trends: {
          views: calcTrend(viewsThisMonth, prevViews),
          leads: calcTrend(leadsThisMonth, prevLeads),
          bookings: calcTrend(bookingCount, prevBookings),
          revenue: calcTrend(estimatedRevenue, prevRevenue),
        },
      };
    },
    refetchInterval: 60_000,
  });
}
