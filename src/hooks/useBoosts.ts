import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

export interface NeighborhoodBoost {
  id: string;
  user_id: string;
  status: string;
  target_city: string | null;
  target_postal_code: string | null;
  radius_km: number;
  duration_days: number;
  started_at: string;
  expires_at: string;
  views_count: number;
  leads_count: number;
  bookings_count: number;
  created_at: string;
}

export function useBoosts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["neighborhood-boosts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neighborhood_boosts")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NeighborhoodBoost[];
    },
  });
}

export function useActiveBoosts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["active-boosts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neighborhood_boosts")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString());
      if (error) throw error;
      return (data ?? []) as NeighborhoodBoost[];
    },
  });
}

/** Fetch all currently boosted user IDs (for discover page) */
export function useBoostedUserIds() {
  return useQuery({
    queryKey: ["boosted-user-ids"],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neighborhood_boosts")
        .select("user_id, target_city")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString());
      if (error) throw error;
      return (data ?? []) as { user_id: string; target_city: string | null }[];
    },
  });
}

export function useCreateBoost() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      target_city: string;
      target_postal_code?: string;
      radius_km: number;
      duration_days: number;
    }) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.duration_days);

      const { error } = await supabase
        .from("neighborhood_boosts")
        .insert({
          user_id: user!.id,
          target_city: input.target_city,
          target_postal_code: input.target_postal_code || null,
          radius_km: input.radius_km,
          duration_days: input.duration_days,
          expires_at: expiresAt.toISOString(),
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["neighborhood-boosts"] });
      qc.invalidateQueries({ queryKey: ["active-boosts"] });
      qc.invalidateQueries({ queryKey: ["boosted-user-ids"] });
      toast.success("Neighborhood Boost activated!");
    },
    onError: () => toast.error("Failed to activate boost"),
  });
}

export function useCancelBoost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (boostId: string) => {
      const { error } = await supabase
        .from("neighborhood_boosts")
        .update({ status: "cancelled" } as any)
        .eq("id", boostId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["neighborhood-boosts"] });
      qc.invalidateQueries({ queryKey: ["active-boosts"] });
      qc.invalidateQueries({ queryKey: ["boosted-user-ids"] });
      toast.success("Boost cancelled");
    },
  });
}

/** Track boost views for a set of boosted user IDs (called once per page load) */
export function useTrackBoostViews(boostedUserIds: string[]) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || boostedUserIds.length === 0) return;
    tracked.current = true;

    // Fire-and-forget RPCs for each boosted user visible
    boostedUserIds.forEach((userId) => {
      supabase.rpc("increment_boost_views", { p_user_id: userId } as any).then();
    });
  }, [boostedUserIds]);
}
