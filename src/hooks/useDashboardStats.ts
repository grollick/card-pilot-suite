import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek } from "date-fns";

// Re-export split hooks for backward compatibility
export { useBusinessPerformance } from "./useBusinessPerformance";
export { useYesterdaySnapshot } from "./useYesterdaySnapshot";
export { useRecentActivity } from "./useRecentActivity";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();

      const [leadsRes, bookingsRes, openLeadsRes, stagesRes, leadsWithStageRes] = await Promise.all([
        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayStart),
        supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .gte("created_at", weekStart),
        supabase
          .from("leads")
          .select("id, pipeline_stages(is_won, is_lost)")
          .eq("status", "open"),
        supabase
          .from("pipeline_stages")
          .select("id, name, sort_order")
          .order("sort_order", { ascending: true }),
        supabase
          .from("leads")
          .select("stage_id")
          .eq("status", "open"),
      ]);

      const activeOpps = (openLeadsRes.data ?? []).filter((l: any) => {
        const s = l.pipeline_stages;
        return !s?.is_won && !s?.is_lost;
      });

      const stages = stagesRes.data ?? [];
      const leadsWithStage = leadsWithStageRes.data ?? [];
      const stageCounts = stages.map(s => ({
        id: s.id,
        name: s.name,
        count: leadsWithStage.filter(l => l.stage_id === s.id).length,
      }));

      const totalPipelineLeads = stageCounts.reduce((s, c) => s + c.count, 0);

      return {
        leadsToday: leadsRes.count ?? 0,
        bookingsWeek: bookingsRes.count ?? 0,
        activeOpportunities: activeOpps.length,
        pipelineValue: totalPipelineLeads,
        stageCounts,
      };
    },
    refetchInterval: 60_000,
  });
}
