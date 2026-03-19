import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DutyStatus {
  id: string;
  user_id: string;
  is_on_duty: boolean;
  available_until: string | null;
  service_types: string[];
  service_radius_km: number | null;
  max_leads: number | null;
  leads_received: number;
  auto_off_after_hours: number | null;
  auto_off_outside_hours: boolean;
  went_on_duty_at: string | null;
  updated_at: string;
}

export interface DutyAnalytics {
  leadsReceived: number;
  avgResponseMin: number | null;
  responseRate: number;
  missedLeads: number;
  bookingsFromDuty: number;
}

export function useEstimateDuty() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ["estimate-duty-status"],
    enabled: !!user,
    queryFn: async (): Promise<DutyStatus | null> => {
      const { data, error } = await supabase
        .from("estimate_duty_status")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as DutyStatus | null;
    },
  });

  const analyticsQuery = useQuery({
    queryKey: ["estimate-duty-analytics"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<DutyAnalytics> => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

      const { data: logs } = await supabase
        .from("estimate_duty_log")
        .select("event_type, response_time_minutes, created_at")
        .eq("user_id", user!.id)
        .gte("created_at", thirtyDaysAgo);

      const entries = logs ?? [];
      const received = entries.filter((l: any) => l.event_type === "lead_received").length;
      const responded = entries.filter((l: any) => l.event_type === "responded");
      const missed = entries.filter((l: any) => l.event_type === "missed").length;
      const booked = entries.filter((l: any) => l.event_type === "booked").length;

      const responseTimes = responded
        .map((r: any) => r.response_time_minutes)
        .filter((t: any): t is number => t !== null);
      const avgResponse = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length)
        : null;
      const responseRate = received > 0
        ? Math.round((responded.length / received) * 100)
        : 0;

      return {
        leadsReceived: received,
        avgResponseMin: avgResponse,
        responseRate,
        missedLeads: missed,
        bookingsFromDuty: booked,
      };
    },
  });

  const toggleDuty = useMutation({
    mutationFn: async (params: {
      is_on_duty: boolean;
      available_until?: string | null;
      service_types?: string[];
      service_radius_km?: number | null;
      max_leads?: number | null;
      auto_off_after_hours?: number | null;
      auto_off_outside_hours?: boolean;
    }) => {
      const payload = {
        user_id: user!.id,
        is_on_duty: params.is_on_duty,
        available_until: params.available_until ?? null,
        service_types: params.service_types ?? [],
        service_radius_km: params.service_radius_km ?? null,
        max_leads: params.max_leads ?? null,
        auto_off_after_hours: params.auto_off_after_hours ?? null,
        auto_off_outside_hours: params.auto_off_outside_hours ?? false,
        went_on_duty_at: params.is_on_duty ? new Date().toISOString() : null,
        leads_received: params.is_on_duty ? 0 : (statusQuery.data?.leads_received ?? 0),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("estimate_duty_status")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["estimate-duty-status"] });
      toast.success(data.is_on_duty ? "You're now On Duty for Estimates!" : "You're now Off Duty");
    },
    onError: () => toast.error("Failed to update duty status"),
  });

  return {
    status: statusQuery.data,
    isOnDuty: statusQuery.data?.is_on_duty ?? false,
    isLoading: statusQuery.isLoading,
    analytics: analyticsQuery.data,
    analyticsLoading: analyticsQuery.isLoading,
    toggleDuty,
  };
}
