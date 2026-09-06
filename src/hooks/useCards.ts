import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { DEFAULT_SECTIONS } from "@/hooks/useCard";
import type { Json } from "@/integrations/supabase/types";

export interface MyCard {
  id: string;
  slug: string | null;
  label: string | null;
  company: string | null;
  profession_id: string | null;
  is_primary: boolean;
  status: string;
  updated_at: string;
}

/** How many cards each plan may keep. -1 = unlimited */
export const CARD_LIMIT_BY_PLAN: Record<string, number> = {
  starter: 1,
  free: 1,
  growth: 3,
  pro: -1,
  agency: -1,
};

export function slugifyCard(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** All cards owned by the signed-in user */
export function useMyCards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-cards"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("id, slug, label, company, profession_id, is_primary, status, updated_at")
        .eq("user_id", user!.id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as MyCard[];
    },
  });
}

/** Plan-aware helper for the multi-card feature */
export function useCardAllowance() {
  const { planKey } = usePlanLimits();
  const { data: cards = [] } = useMyCards();
  const limit = CARD_LIMIT_BY_PLAN[planKey] ?? 1;
  const canAddMore = limit === -1 || cards.length < limit;
  return { planKey, cards, limit, canAddMore, isMultiCardPlan: limit !== 1 };
}

export function useProfessionOptions() {
  return useQuery({
    queryKey: ["profession-options"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professions")
        .select("id, name, category")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { label: string; slug: string; company?: string | null; profession_id?: string | null }) => {
      const { data, error } = await supabase
        .from("cards")
        .insert({
          user_id: user!.id,
          label: input.label,
          slug: input.slug,
          company: input.company || null,
          profession_id: input.profession_id || null,
          is_primary: false,
          status: "draft",
          sections_json: DEFAULT_SECTIONS as unknown as Json,
          theme_json: {} as Json,
        } as any)
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-cards"] });
      qc.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function useUpdateCardMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; label?: string; slug?: string; company?: string | null; profession_id?: string | null }) => {
      const { id, ...rest } = input;
      const { error } = await supabase.from("cards").update(rest as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-cards"] });
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["public-card"] });
    },
  });
}

export function useSetPrimaryCard() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (cardId: string) => {
      await supabase.from("cards").update({ is_primary: false } as any).eq("user_id", user!.id);
      const { error } = await supabase.from("cards").update({ is_primary: true } as any).eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-cards"] });
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["public-card"] });
    },
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase.from("cards").delete().eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-cards"] });
      qc.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}
