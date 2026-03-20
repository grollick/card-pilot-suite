import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export type AssignmentMode = "round_robin" | "availability" | "manual";

export interface LeadAssignmentSettings {
  id: string;
  user_id: string;
  org_id: string | null;
  assignment_mode: AssignmentMode;
  fallback_to_owner: boolean;
  match_by_services: boolean;
  match_by_location: boolean;
  filter_by_availability: boolean;
  round_robin_index: number;
}

export interface LeadAssignment {
  id: string;
  lead_id: string;
  assigned_to: string;
  assigned_by: string | null;
  org_id: string | null;
  assignment_mode: string;
  status: string;
  created_at: string;
}

export function useLeadAssignmentSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lead-assignment-settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_assignment_settings" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as LeadAssignmentSettings | null;
    },
  });
}

export function useUpsertLeadAssignmentSettings() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<LeadAssignmentSettings>) => {
      const payload = {
        user_id: user!.id,
        org_id: currentOrg?.id || null,
        ...settings,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("lead_assignment_settings" as any)
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-assignment-settings"] });
      toast.success("Lead routing settings saved");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useLeadAssignments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lead-assignments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_assignments" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as LeadAssignment[];
    },
  });
}

export function useAssignLead() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, assignTo, mode = "manual" }: { leadId: string; assignTo: string; mode?: string }) => {
      const { error } = await supabase
        .from("lead_assignments" as any)
        .insert({
          lead_id: leadId,
          assigned_to: assignTo,
          assigned_by: user!.id,
          org_id: currentOrg?.id || null,
          assignment_mode: mode,
        });
      if (error) throw error;

      // Create notification for assigned staff
      if (assignTo !== user!.id) {
        await supabase.from("notifications" as any).insert({
          user_id: assignTo,
          title: "New lead assigned to you",
          type: "lead_assigned",
          related_id: leadId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead assigned successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useAutoAssignLead() {
  const { user } = useAuth();
  const { currentOrg, members } = useOrg();
  const { data: settings } = useLeadAssignmentSettings();
  const assignLead = useAssignLead();
  const upsertSettings = useUpsertLeadAssignmentSettings();

  const autoAssign = async (leadId: string) => {
    if (!user || !settings || settings.assignment_mode === "manual") return null;

    const eligibleMembers = members.filter((m) => m.user_id !== user.id || members.length === 1);
    if (eligibleMembers.length === 0) {
      // Fallback to owner
      if (settings.fallback_to_owner) {
        const owner = members.find((m) => m.role === "owner");
        if (owner) {
          await assignLead.mutateAsync({ leadId, assignTo: owner.user_id, mode: settings.assignment_mode });
          return owner.user_id;
        }
      }
      return null;
    }

    if (settings.assignment_mode === "round_robin") {
      const idx = settings.round_robin_index % eligibleMembers.length;
      const target = eligibleMembers[idx];
      await assignLead.mutateAsync({ leadId, assignTo: target.user_id, mode: "round_robin" });
      await upsertSettings.mutateAsync({ round_robin_index: idx + 1 });
      return target.user_id;
    }

    if (settings.assignment_mode === "availability") {
      // Simple: pick first available member (could be enhanced with real availability checks)
      const target = eligibleMembers[0];
      if (target) {
        await assignLead.mutateAsync({ leadId, assignTo: target.user_id, mode: "availability" });
        return target.user_id;
      }
    }

    // Fallback
    if (settings.fallback_to_owner) {
      const owner = members.find((m) => m.role === "owner");
      if (owner) {
        await assignLead.mutateAsync({ leadId, assignTo: owner.user_id, mode: "fallback" });
        return owner.user_id;
      }
    }

    return null;
  };

  return { autoAssign };
}

export function useLeadDistribution() {
  const { data: assignments = [] } = useLeadAssignments();

  const distribution = assignments.reduce<Record<string, number>>((acc, a) => {
    acc[a.assigned_to] = (acc[a.assigned_to] || 0) + 1;
    return acc;
  }, {});

  return distribution;
}
