import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface QueueSlot {
  id: string;
  user_id: string;
  account_id: string | null;
  platform: string;
  day_of_week: number;
  time_slot: string;
  enabled: boolean;
  created_at: string;
}

const KEY = ["social-queue-slots"] as const;

export function useQueueSlots() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("social_queue_slots")
        .select("*")
        .order("day_of_week")
        .order("time_slot");
      if (error) throw error;
      return (data ?? []) as QueueSlot[];
    },
  });
}

export function useCreateQueueSlot() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (slot: { platform: string; day_of_week: number; time_slot: string; account_id?: string }) => {
      const { data, error } = await (supabase as any)
        .from("social_queue_slots")
        .insert({ ...slot, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as QueueSlot;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteQueueSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("social_queue_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
