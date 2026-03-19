import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LeadRoutingEntry {
  id: string;
  quote_request_id: string;
  user_id: string;
  lead_id: string | null;
  status: string;
  delivered_at: string;
  viewed_at: string | null;
  responded_at: string | null;
  converted_at: string | null;
  reminder_1h_sent: boolean;
  reminder_24h_sent: boolean;
  created_at: string;
}

export function useLeadRoutingLog() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lead-routing-log", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_routing_log" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("delivered_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LeadRoutingEntry[];
    },
  });
}

export function useLeadRoutingStats() {
  const { data: log } = useLeadRoutingLog();

  const stats = {
    totalDelivered: log?.length ?? 0,
    viewed: log?.filter((l) => l.viewed_at).length ?? 0,
    responded: log?.filter((l) => l.responded_at).length ?? 0,
    converted: log?.filter((l) => l.converted_at).length ?? 0,
    responseRate: 0,
    conversionRate: 0,
  };

  if (stats.totalDelivered > 0) {
    stats.responseRate = Math.round((stats.responded / stats.totalDelivered) * 100);
    stats.conversionRate = Math.round((stats.converted / stats.totalDelivered) * 100);
  }

  return stats;
}

export function useMarkLeadViewed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (routingId: string) => {
      const { error } = await supabase
        .from("lead_routing_log" as any)
        .update({ viewed_at: new Date().toISOString(), status: "viewed" })
        .eq("id", routingId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead-routing-log"] }),
  });
}

export function useMarkLeadResponded() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (routingId: string) => {
      const { error } = await supabase
        .from("lead_routing_log" as any)
        .update({ responded_at: new Date().toISOString(), status: "responded" })
        .eq("id", routingId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead-routing-log"] }),
  });
}

export function useMarkLeadConverted() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (routingId: string) => {
      const { error } = await supabase
        .from("lead_routing_log" as any)
        .update({ converted_at: new Date().toISOString(), status: "converted" })
        .eq("id", routingId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead-routing-log"] }),
  });
}
