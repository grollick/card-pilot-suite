import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SystemEvent {
  id: string;
  event_type: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  meta_data: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string;
}

export function useRecentSystemEvents(limit = 25) {
  return useQuery({
    queryKey: ["system-events", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_events" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as SystemEvent[];
    },
    refetchInterval: 30_000,
  });
}
