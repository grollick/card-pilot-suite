import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays } from "date-fns";

export function useYesterdaySnapshot() {
  return useQuery({
    queryKey: ["yesterday-snapshot"],
    queryFn: async () => {
      const now = new Date();
      const yesterdayStart = startOfDay(subDays(now, 1)).toISOString();
      const todayStart = startOfDay(now).toISOString();

      const [viewsRes, leadsRes, bookingsRes, servicesRes, followupsRes] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("event_type", "card_view")
          .gte("created_at", yesterdayStart)
          .lt("created_at", todayStart),
        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .gte("created_at", yesterdayStart)
          .lt("created_at", todayStart),
        supabase
          .from("bookings")
          .select("id, service_id")
          .gte("created_at", yesterdayStart)
          .lt("created_at", todayStart),
        supabase
          .from("booking_services")
          .select("price")
          .eq("active", true),
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("status", "open")
          .lte("due_date", todayStart.split("T")[0]),
      ]);

      const prices = (servicesRes.data ?? []).map(s => s.price ?? 0).filter(p => p > 0);
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      const bookingCount = bookingsRes.data?.length ?? 0;

      return {
        views: viewsRes.count ?? 0,
        leads: leadsRes.count ?? 0,
        bookings: bookingCount,
        potentialRevenue: Math.round(bookingCount * avgPrice),
        followupsNeeded: followupsRes.count ?? 0,
      };
    },
    refetchInterval: 120_000,
  });
}
