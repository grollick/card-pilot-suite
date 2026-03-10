import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AutopilotSettings {
  id: string;
  user_id: string;
  enabled: boolean;
  approval_mode: string;
  lead_followup: boolean;
  estimate_reminders: boolean;
  review_requests: boolean;
  social_posts: boolean;
  promotions: boolean;
}

export interface AutopilotLogEntry {
  id: string;
  user_id: string;
  action_type: string;
  title: string;
  description: string | null;
  status: string;
  meta_json: any;
  created_at: string;
}

export function useAutopilotSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["autopilot-settings"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("autopilot_settings")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as AutopilotSettings | null;
    },
  });
}

export function useUpsertAutopilotSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (updates: Partial<AutopilotSettings>) => {
      const { data: existing } = await supabase
        .from("autopilot_settings")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("autopilot_settings")
          .update(updates)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("autopilot_settings")
          .insert({ user_id: user!.id, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["autopilot-settings"] }),
  });
}

export function useAutopilotLog(limit = 50) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["autopilot-log", limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("autopilot_log")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AutopilotLogEntry[];
    },
  });
}

export function useAutopilotStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["autopilot-stats"],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("autopilot_log")
        .select("action_type, status")
        .eq("user_id", user!.id)
        .gte("created_at", since);
      if (error) throw error;
      const entries = data ?? [];
      return {
        total: entries.length,
        leadFollowups: entries.filter(e => e.action_type === "lead_followup").length,
        estimateReminders: entries.filter(e => e.action_type === "estimate_reminder").length,
        reviewRequests: entries.filter(e => e.action_type === "review_request").length,
        socialPosts: entries.filter(e => e.action_type === "social_post").length,
        promotions: entries.filter(e => e.action_type === "promotion").length,
        pendingApproval: entries.filter(e => e.status === "pending_approval").length,
      };
    },
  });
}

export function useRunAutopilot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("run-autopilot");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["autopilot-log"] });
      qc.invalidateQueries({ queryKey: ["autopilot-stats"] });
    },
  });
}
