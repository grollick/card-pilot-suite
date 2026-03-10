import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth } from "date-fns";

export function useBusinessPerformance() {
  return useQuery({
    queryKey: ["business-performance"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();

      const [viewsRes, leadsRes, bookingsRes, servicesRes] = await Promise.all([
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

      return {
        views: viewsThisMonth,
        leads: leadsThisMonth,
        bookings: bookingCount,
        estimatedRevenue,
        conversionRate,
        avgPrice: Math.round(avgPrice),
      };
    },
    refetchInterval: 60_000,
  });
}
