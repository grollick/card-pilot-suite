import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DailyNote {
  id: string;
  user_id: string;
  content: string;
  note_type: "note" | "task";
  is_completed: boolean;
  note_date: string;
  created_at: string;
  updated_at: string;
}

export function useDailyNotes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["daily-notes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_notes" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as DailyNote[];
    },
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: { content: string; note_type: "note" | "task"; note_date?: string }) => {
      const { error } = await supabase.from("daily_notes" as any).insert({
        user_id: user!.id,
        content: params.content,
        note_type: params.note_type,
        note_date: params.note_date || new Date().toISOString().split("T")[0],
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily-notes"] }),
  });
}

export function useToggleNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from("daily_notes" as any)
        .update({ is_completed: params.is_completed } as any)
        .eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily-notes"] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_notes" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily-notes"] }),
  });
}
