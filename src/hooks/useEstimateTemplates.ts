import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { TradesTemplate } from "@/lib/estimateTemplates";

export interface CustomEstimateTemplate {
  id: string;
  user_id: string;
  name: string;
  default_job_type: string;
  sections_json: TradesTemplate["sections"];
  created_at: string;
  updated_at: string;
}

export function useCustomEstimateTemplates() {
  return useQuery({
    queryKey: ["estimate-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("estimate_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as CustomEstimateTemplate[];
    },
  });
}

export function useCreateEstimateTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (tpl: { name: string; default_job_type: string; sections_json: any }) => {
      const { data, error } = await (supabase as any)
        .from("estimate_templates")
        .insert({ ...tpl, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as CustomEstimateTemplate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["estimate-templates"] }),
  });
}

export function useDeleteEstimateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("estimate_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["estimate-templates"] }),
  });
}
