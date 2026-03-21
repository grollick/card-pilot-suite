import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GrowthWorkflow {
  id: string;
  name: string;
  workflow_type: string;
  status: string;
  trigger_config: Record<string, any>;
  action_config: Record<string, any>;
  stats_json: { sent: number; opened: number; replied: number; converted: number };
  created_at: string;
}

export interface AutomationLogEntry {
  id: string;
  workflow_id: string | null;
  action_type: string;
  target_user_id: string | null;
  target_contact_id: string | null;
  status: string;
  result_json: Record<string, any>;
  created_at: string;
}

export function useGrowthWorkflows() {
  const qc = useQueryClient();

  const query = useQuery<GrowthWorkflow[]>({
    queryKey: ["growth-workflows"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("growth_automation_workflows")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as GrowthWorkflow[];
    },
  });

  const createWorkflow = useMutation({
    mutationFn: async (workflow: Partial<GrowthWorkflow>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("growth_automation_workflows").insert({
        ...workflow,
        created_by: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["growth-workflows"] }),
  });

  const updateWorkflow = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<GrowthWorkflow>) => {
      const { error } = await supabase
        .from("growth_automation_workflows")
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["growth-workflows"] }),
  });

  return { ...query, createWorkflow, updateWorkflow };
}

export function useAutomationLog(limit = 50) {
  return useQuery<AutomationLogEntry[]>({
    queryKey: ["automation-log", limit],
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("growth_automation_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as unknown as AutomationLogEntry[];
    },
  });
}

export function useHandoffContacts() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["handoff-contacts"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outreach_contacts")
        .select("*")
        .eq("flagged_for_handoff", true)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const resolveHandoff = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("outreach_contacts")
        .update({ flagged_for_handoff: false, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["handoff-contacts"] }),
  });

  return { ...query, resolveHandoff };
}
