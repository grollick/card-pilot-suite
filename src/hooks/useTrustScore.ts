import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type TrustLevel = "new" | "verified" | "trusted";

export interface TrustInfo {
  score: number;
  level: TrustLevel;
  signals: Record<string, any>;
  isSuspended: boolean;
}

/** Fetch the current user's trust score & signals */
export function useTrustScore() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["trust-score", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("trust_score, trust_level, trust_signals, is_suspended")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return {
        score: (data as any).trust_score ?? 10,
        level: ((data as any).trust_level ?? "new") as TrustLevel,
        signals: (data as any).trust_signals ?? {},
        isSuspended: (data as any).is_suspended ?? false,
      } as TrustInfo;
    },
    staleTime: 60_000,
  });

  return { trustInfo: data, isLoading, refetch };
}

/** Recalculate trust score via the DB function */
export function useRecalculateTrust() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.rpc("recalculate_trust_score", {
        p_user_id: userId,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["trust-score", userId] });
      queryClient.invalidateQueries({ queryKey: ["flagged-profiles"] });
    },
  });
}

/** Check if current user can perform a trust-gated action */
export function useTrustGate() {
  const { trustInfo } = useTrustScore();

  const canPerformAction = useCallback(
    (requiredLevel: TrustLevel = "verified"): { allowed: boolean; reason?: string } => {
      if (!trustInfo) return { allowed: false, reason: "Loading trust data" };
      if (trustInfo.isSuspended) return { allowed: false, reason: "Account suspended" };

      const levelOrder: TrustLevel[] = ["new", "verified", "trusted"];
      const userIdx = levelOrder.indexOf(trustInfo.level);
      const requiredIdx = levelOrder.indexOf(requiredLevel);

      if (userIdx < requiredIdx) {
        return {
          allowed: false,
          reason:
            trustInfo.level === "new"
              ? "Please complete your profile to unlock this feature"
              : "Insufficient trust level for this action",
        };
      }

      return { allowed: true };
    },
    [trustInfo]
  );

  return { canPerformAction, trustInfo };
}
