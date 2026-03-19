import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EstimateRequest {
  id: string;
  requester_name: string;
  requester_email: string | null;
  requester_phone: string | null;
  service_needed: string | null;
  category: string | null;
  request_details: string | null;
  budget: string | null;
  timeline: string | null;
  city: string | null;
  location: string | null;
  source: string;
  status: string;
  lead_quality_score: number | null;
  profession: string | null;
  created_at: string;
}

export interface EstimateMatch {
  id: string;
  estimate_request_id: string;
  user_id: string;
  match_score: number;
  priority_rank: number;
  was_notified: boolean;
  notified_at: string | null;
  response_deadline_at: string | null;
  status: string;
  responded_at: string | null;
  lead_id: string | null;
  created_at: string;
  estimate_request?: EstimateRequest;
}

export function useEstimateMatches() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const matchesQuery = useQuery({
    queryKey: ["estimate-matches"],
    enabled: !!user,
    queryFn: async (): Promise<EstimateMatch[]> => {
      const { data, error } = await (supabase
        .from("estimate_matches" as any)
        .select("*, estimate_requests(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50) as any);
      if (error) throw error;
      return (data ?? []).map((m: any) => ({
        ...m,
        estimate_request: m.estimate_requests ?? undefined,
      }));
    },
  });

  const respondToMatch = useMutation({
    mutationFn: async ({ matchId, action }: { matchId: string; action: "accepted" | "declined" }) => {
      const { error } = await (supabase
        .from("estimate_matches" as any)
        .update({
          status: action,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchId)
        .eq("user_id", user!.id) as any);
      if (error) throw error;

      // Update duty status counters
      if (action === "accepted") {
        await (supabase
          .from("estimate_duty_status" as any)
          .update({
            accepted_leads_count: (await supabase
              .from("estimate_duty_status")
              .select("accepted_leads_count")
              .eq("user_id", user!.id)
              .single()
              .then(r => (r.data as any)?.accepted_leads_count ?? 0)) + 1,
            last_response_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user!.id) as any);
      }
    },
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ["estimate-matches"] });
      qc.invalidateQueries({ queryKey: ["estimate-duty-status"] });
      toast.success(action === "accepted" ? "Estimate request accepted!" : "Estimate request declined");
    },
    onError: () => toast.error("Failed to respond to estimate request"),
  });

  // Realtime subscription for new matches
  const pendingCount = (matchesQuery.data ?? []).filter(m => m.status === "pending").length;

  return {
    matches: matchesQuery.data ?? [],
    isLoading: matchesQuery.isLoading,
    pendingCount,
    respondToMatch,
  };
}

export function useSubmitEstimateRequest() {
  return useMutation({
    mutationFn: async (request: {
      requester_name: string;
      requester_email?: string;
      requester_phone?: string;
      service_needed?: string;
      request_details?: string;
      budget?: string;
      timeline?: string;
      city?: string;
      location?: string;
      profession?: string;
      source?: string;
    }) => {
      const { data, error } = await (supabase
        .from("estimate_requests" as any)
        .insert({
          requester_name: request.requester_name,
          requester_email: request.requester_email ?? null,
          requester_phone: request.requester_phone ?? null,
          service_needed: request.service_needed ?? null,
          request_details: request.request_details ?? null,
          budget: request.budget ?? null,
          timeline: request.timeline ?? null,
          city: request.city ?? null,
          location: request.location ?? null,
          profession: request.profession ?? null,
          source: request.source ?? "marketplace",
        })
        .select()
        .single() as any);
      if (error) throw error;

      // Trigger routing
      await supabase.functions.invoke("process-estimate-matches", {
        body: { estimateRequestId: data.id },
      });

      return data;
    },
    onSuccess: () => toast.success("Estimate request submitted! Providers will respond shortly."),
    onError: () => toast.error("Failed to submit estimate request"),
  });
}

export function useDutyServices() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const servicesQuery = useQuery({
    queryKey: ["duty-services"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("estimate_duty_services" as any)
        .select("*, booking_services(id, name)")
        .eq("user_id", user!.id) as any);
      if (error) throw error;
      return data ?? [];
    },
  });

  const setDutyServices = useMutation({
    mutationFn: async (serviceIds: string[]) => {
      // Delete existing
      await (supabase
        .from("estimate_duty_services" as any)
        .delete()
        .eq("user_id", user!.id) as any);

      if (serviceIds.length === 0) return;

      // Insert new
      const rows = serviceIds.map(sid => ({
        user_id: user!.id,
        service_id: sid,
      }));
      const { error } = await (supabase
        .from("estimate_duty_services" as any)
        .insert(rows) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["duty-services"] });
      toast.success("Duty services updated");
    },
  });

  return {
    dutyServices: servicesQuery.data ?? [],
    isLoading: servicesQuery.isLoading,
    setDutyServices,
  };
}
