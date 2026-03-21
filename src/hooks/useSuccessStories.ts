import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SuccessStory {
  id: string;
  user_name: string;
  business_type: string;
  result_text: string;
  timeframe: string;
  quote: string;
  metric_value: string;
  metric_label: string;
  is_featured: boolean;
  is_active: boolean;
  display_locations: string[];
  created_at: string;
  updated_at: string;
}

export function useSuccessStories(location?: string) {
  return useQuery({
    queryKey: ["success-stories", location],
    queryFn: async () => {
      let q = supabase
        .from("success_stories")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (location) {
        q = q.contains("display_locations", [location]);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as SuccessStory[];
    },
  });
}

export function useAllSuccessStories() {
  return useQuery({
    queryKey: ["success-stories-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("success_stories")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SuccessStory[];
    },
  });
}

export function useUpsertSuccessStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (story: Partial<SuccessStory> & { user_name: string; business_type: string; result_text: string }) => {
      if (story.id) {
        const { error } = await supabase
          .from("success_stories")
          .update({ ...story, updated_at: new Date().toISOString() } as any)
          .eq("id", story.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("success_stories").insert(story as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["success-stories"] });
      qc.invalidateQueries({ queryKey: ["success-stories-admin"] });
    },
  });
}

export function useDeleteSuccessStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("success_stories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["success-stories"] });
      qc.invalidateQueries({ queryKey: ["success-stories-admin"] });
    },
  });
}
