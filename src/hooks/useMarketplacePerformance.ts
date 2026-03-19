import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useCard";
import { subDays, format } from "date-fns";

export interface MarketplacePerformanceData {
  totalViews: number;
  totalLeads: number;
  totalBookings: number;
  totalRevenue: number;
  conversionRate: number;
  leadsBySource: { source: string; count: number }[];
  dailyMetrics: { date: string; views: number; leads: number; bookings: number }[];
  unbilledLeads: number;
}

export function useMarketplacePerformance(days = 30) {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["marketplace-performance", user?.id, days],
    enabled: !!user,
    queryFn: async (): Promise<MarketplacePerformanceData> => {
      const since = subDays(new Date(), days).toISOString();

      const [metricsResult, leadsResult, creditsResult] = await Promise.all([
        supabase
          .from("daily_metrics")
          .select("metric_date, card_views, leads_count, bookings_count, revenue")
          .eq("user_id", user!.id)
          .gte("metric_date", format(subDays(new Date(), days), "yyyy-MM-dd"))
          .order("metric_date", { ascending: true }),
        supabase
          .from("leads")
          .select("id, source, created_at")
          .eq("user_id", user!.id)
          .gte("created_at", since),
        supabase
          .from("marketplace_lead_credits" as any)
          .select("id, source, billed, created_at")
          .eq("user_id", user!.id)
          .gte("created_at", since),
      ]);

      const metrics = metricsResult.data ?? [];
      const leads = leadsResult.data ?? [];
      const credits = (creditsResult.data ?? []) as any[];

      const totalViews = metrics.reduce((s, m) => s + (m.card_views ?? 0), 0);
      const totalLeads = metrics.reduce((s, m) => s + (m.leads_count ?? 0), 0);
      const totalBookings = metrics.reduce((s, m) => s + (m.bookings_count ?? 0), 0);
      const totalRevenue = metrics.reduce((s, m) => s + Number(m.revenue ?? 0), 0);
      const conversionRate = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;

      // Leads by source
      const sourceMap = new Map<string, number>();
      leads.forEach((l: any) => {
        const src = l.source ?? "other";
        sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1);
      });
      const leadsBySource = Array.from(sourceMap.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);

      // Daily chart data
      const dailyMetrics = metrics.map((m) => ({
        date: m.metric_date,
        views: m.card_views ?? 0,
        leads: m.leads_count ?? 0,
        bookings: m.bookings_count ?? 0,
      }));

      const unbilledLeads = credits.filter((c: any) => !c.billed).length;

      return {
        totalViews,
        totalLeads,
        totalBookings,
        totalRevenue,
        conversionRate,
        leadsBySource,
        dailyMetrics,
        unbilledLeads,
      };
    },
  });
}
