import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ── Fetch all contacts with stage + tags ──
export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, pipeline_stages(name, is_won, is_lost), contact_tags(tag_id, tags(id, name, color))")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePipelineStages() {
  return useQuery({
    queryKey: ["pipeline-stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_stages")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Create tag ──
export function useCreateTag() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("tags")
        .insert({ name, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

// ── Add/remove tag from contact ──
export function useToggleContactTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, tagId, add }: { leadId: string; tagId: string; add: boolean }) => {
      if (add) {
        const { error } = await supabase.from("contact_tags").insert({ lead_id: leadId, tag_id: tagId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contact_tags").delete().eq("lead_id", leadId).eq("tag_id", tagId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contact"] });
    },
  });
}
