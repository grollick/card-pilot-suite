import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FunnelStage {
  id: string;
  label: string;
  count: number;
  users: { id: string; name: string; email?: string; business?: string; profession?: string; created_at: string }[];
}

export interface FunnelInsight {
  type: "warning" | "success" | "info";
  message: string;
  suggestion: string;
}

export interface AdminFunnelData {
  stages: FunnelStage[];
  insights: FunnelInsight[];
  filters: { days: number; profession: string | null; location: string | null };
}

export function useAdminFunnelStats(days = 30, profession?: string, location?: string) {
  return useQuery<AdminFunnelData>({
    queryKey: ["admin-funnel-stats", days, profession, location],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const params = new URLSearchParams({ days: String(days) });
      if (profession) params.set("profession", profession);
      if (location) params.set("location", location);

      const res = await supabase.functions.invoke(`admin-funnel-stats?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw new Error(res.error.message || "Failed to fetch funnel stats");
      return res.data as AdminFunnelData;
    },
  });
}
