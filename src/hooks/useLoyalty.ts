import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LoyaltyProgram {
  id: string;
  user_id: string;
  name: string;
  stamps_required: number;
  reward_description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyCard {
  id: string;
  program_id: string;
  user_id: string;
  lead_id: string | null;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  stamps_collected: number;
  reward_redeemed: boolean;
  redeemed_at: string | null;
  created_at: string;
}

export interface LoyaltyStamp {
  id: string;
  card_id: string;
  stamped_at: string;
  stamped_by: string | null;
  notes: string | null;
}

export function useLoyaltyProgram() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["loyalty-program", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_programs" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as LoyaltyProgram | null;
    },
  });
}

export function useUpsertLoyaltyProgram() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (updates: Partial<LoyaltyProgram>) => {
      const { data: existing } = await supabase
        .from("loyalty_programs" as any)
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("loyalty_programs" as any)
          .update({ ...updates, updated_at: new Date().toISOString() } as any)
          .eq("id", (existing as any).id)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as LoyaltyProgram;
      } else {
        const { data, error } = await supabase
          .from("loyalty_programs" as any)
          .insert({ user_id: user!.id, ...updates } as any)
          .select()
          .single();
        if (error) throw error;
        return data as unknown as LoyaltyProgram;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["loyalty-program"] }),
  });
}

export function useLoyaltyCards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["loyalty-cards", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_cards" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LoyaltyCard[];
    },
  });
}

export function useAddStamp() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ cardId, notes }: { cardId: string; notes?: string }) => {
      // Insert stamp
      const { error: stampErr } = await supabase
        .from("loyalty_stamps" as any)
        .insert({ card_id: cardId, stamped_by: user!.id, notes: notes || null } as any);
      if (stampErr) throw stampErr;

      // Increment stamps_collected
      const { data: card } = await supabase
        .from("loyalty_cards" as any)
        .select("stamps_collected")
        .eq("id", cardId)
        .single();

      const newCount = ((card as any)?.stamps_collected ?? 0) + 1;
      const { error: updateErr } = await supabase
        .from("loyalty_cards" as any)
        .update({ stamps_collected: newCount, updated_at: new Date().toISOString() } as any)
        .eq("id", cardId);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["loyalty-cards"] }),
  });
}

export function useCreateLoyaltyCard() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (card: { programId: string; clientName: string; clientEmail?: string; clientPhone?: string; leadId?: string }) => {
      const { data, error } = await supabase
        .from("loyalty_cards" as any)
        .insert({
          program_id: card.programId,
          user_id: user!.id,
          client_name: card.clientName,
          client_email: card.clientEmail || null,
          client_phone: card.clientPhone || null,
          lead_id: card.leadId || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as LoyaltyCard;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["loyalty-cards"] }),
  });
}

export function useRedeemReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from("loyalty_cards" as any)
        .update({ reward_redeemed: true, redeemed_at: new Date().toISOString(), stamps_collected: 0 } as any)
        .eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["loyalty-cards"] }),
  });
}

export function useLoyaltyStats() {
  const { data: cards = [] } = useLoyaltyCards();
  const { data: program } = useLoyaltyProgram();
  const activeCards = cards.filter(c => !c.reward_redeemed);
  const completedCards = cards.filter(c => c.reward_redeemed);
  const nearCompletion = program ? activeCards.filter(c => c.stamps_collected >= program.stamps_required - 2) : [];
  return { activeCards, completedCards, nearCompletion, totalCards: cards.length, program };
}
