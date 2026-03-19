import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";

export interface AiCreditPack {
  id: string;
  credits: number;
  price_cents: number;
  label: string;
}

export function useAiCredits() {
  const { user } = useAuth();
  const { limits, planKey } = usePlanLimits();

  const usageQuery = useQuery({
    queryKey: ["ai-usage", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const monthKey = new Date().toISOString().slice(0, 7);
      const { data } = await supabase
        .from("ai_usage")
        .select("request_count")
        .eq("user_id", user!.id)
        .eq("month_key", monthKey)
        .maybeSingle();
      return data?.request_count ?? 0;
    },
  });

  const bonusQuery = useQuery({
    queryKey: ["ai-bonus-credits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_credit_purchases")
        .select("credits_remaining")
        .eq("user_id", user!.id)
        .gt("credits_remaining", 0);
      return (data || []).reduce((sum, r) => sum + r.credits_remaining, 0);
    },
  });

  const packsQuery = useQuery({
    queryKey: ["ai-credit-packs"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/purchase-ai-credits`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: "get_packs" }),
        }
      );
      if (!resp.ok) return [] as AiCreditPack[];
      const json = await resp.json();
      return (json.packs || []) as AiCreditPack[];
    },
  });

  const planLimit = limits.ai_requests_monthly;
  const used = usageQuery.data ?? 0;
  const bonus = bonusQuery.data ?? 0;
  const remaining = planLimit === -1 ? Infinity : Math.max(0, planLimit - used) + bonus;
  const isLimited = planLimit !== -1 && used >= planLimit && bonus <= 0;

  const purchasePack = async (packId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/purchase-ai-credits`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ action: "purchase", pack_id: packId }),
      }
    );
    return resp.json();
  };

  return {
    used,
    bonus,
    planLimit,
    remaining,
    isLimited,
    packs: packsQuery.data ?? [],
    purchasePack,
    isLoading: usageQuery.isLoading || bonusQuery.isLoading,
    refetch: () => { usageQuery.refetch(); bonusQuery.refetch(); },
    planKey,
  };
}
