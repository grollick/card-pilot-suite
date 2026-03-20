import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export type AssignmentMode = "round_robin" | "availability" | "manual";
export type RecoveryMode = "reassign" | "notify_backup" | "open_to_all";

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
  recovery_enabled: boolean;
  timeout_minutes: number;
  recovery_mode: RecoveryMode;
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
  responded_at: string | null;
  missed_at: string | null;
  recovery_status: string;
  reassigned_from: string | null;
  timeout_minutes: number;
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
      return data as unknown as LeadAssignmentSettings | null;
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
      return (data || []) as unknown as LeadAssignment[];
    },
  });
}

export function useAssignLead() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId, assignTo, mode = "manual", reassignedFrom,
    }: {
      leadId: string; assignTo: string; mode?: string; reassignedFrom?: string;
    }) => {
      const { error } = await supabase
        .from("lead_assignments" as any)
        .insert({
          lead_id: leadId,
          assigned_to: assignTo,
          assigned_by: user!.id,
          org_id: currentOrg?.id || null,
          assignment_mode: mode,
          reassigned_from: reassignedFrom || null,
          recovery_status: reassignedFrom ? "recovered" : "none",
        });
      if (error) throw error;

      // Notification
      if (assignTo !== user!.id) {
        const title = reassignedFrom
          ? "Missed lead reassigned to you"
          : "New lead assigned to you";
        await supabase.from("notifications" as any).insert({
          user_id: assignTo,
          title,
          type: "lead_assigned",
          related_id: leadId,
        });
      }

      // Notify original assignee about missed lead
      if (reassignedFrom) {
        await supabase.from("notifications" as any).insert({
          user_id: reassignedFrom,
          title: "Lead reassigned due to no response",
          type: "lead_missed",
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

export function useMarkLeadResponded() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("lead_assignments" as any)
        .update({ responded_at: new Date().toISOString(), status: "responded" })
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-assignments"] });
    },
  });
}

export function useMarkLeadMissed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("lead_assignments" as any)
        .update({
          missed_at: new Date().toISOString(),
          status: "missed",
          recovery_status: "missed",
        })
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-assignments"] });
    },
  });
}

export function useAutoAssignLead() {
  const { user } = useAuth();
  const { members } = useOrg();
  const { data: settings } = useLeadAssignmentSettings();
  const assignLead = useAssignLead();
  const upsertSettings = useUpsertLeadAssignmentSettings();

  const autoAssign = async (leadId: string) => {
    if (!user || !settings || settings.assignment_mode === "manual") return null;

    const eligibleMembers = members.filter((m) => m.user_id !== user.id || members.length === 1);
    if (eligibleMembers.length === 0) {
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
      const target = eligibleMembers[0];
      if (target) {
        await assignLead.mutateAsync({ leadId, assignTo: target.user_id, mode: "availability" });
        return target.user_id;
      }
    }

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

export function useRecoverMissedLead() {
  const { members } = useOrg();
  const { data: settings } = useLeadAssignmentSettings();
  const { data: assignments = [] } = useLeadAssignments();
  const assignLead = useAssignLead();
  const markMissed = useMarkLeadMissed();

  const recover = async (assignment: LeadAssignment) => {
    // Mark original as missed
    await markMissed.mutateAsync(assignment.id);

    if (!settings?.recovery_enabled) return null;

    // Find eligible members excluding the one who missed
    const eligible = members.filter((m) => m.user_id !== assignment.assigned_to);

    // Count current assignments per member for fairness
    const loadMap = assignments.reduce<Record<string, number>>((acc, a) => {
      if (a.status === "active") acc[a.assigned_to] = (acc[a.assigned_to] || 0) + 1;
      return acc;
    }, {});

    // Sort by lowest load for fairness
    const sorted = [...eligible].sort(
      (a, b) => (loadMap[a.user_id] || 0) - (loadMap[b.user_id] || 0)
    );

    if (sorted.length === 0) return null;

    if (settings.recovery_mode === "reassign" || settings.recovery_mode === "open_to_all") {
      const target = sorted[0];
      await assignLead.mutateAsync({
        leadId: assignment.lead_id,
        assignTo: target.user_id,
        mode: "recovery",
        reassignedFrom: assignment.assigned_to,
      });
      return target.user_id;
    }

    if (settings.recovery_mode === "notify_backup") {
      // Notify top 2 backup staff
      const backups = sorted.slice(0, 2);
      for (const b of backups) {
        await supabase.from("notifications" as any).insert({
          user_id: b.user_id,
          title: "Missed lead available — respond now!",
          type: "lead_backup",
          related_id: assignment.lead_id,
        });
      }
      return "notified";
    }

    return null;
  };

  return { recover };
}

export function useMissedLeadStats() {
  const { data: assignments = [] } = useLeadAssignments();

  const missed = assignments.filter((a) => a.recovery_status === "missed" || a.status === "missed");
  const recovered = assignments.filter((a) => a.recovery_status === "recovered");
  const responded = assignments.filter((a) => a.status === "responded");
  const active = assignments.filter((a) => a.status === "active");

  return {
    total: assignments.length,
    missedCount: missed.length,
    recoveredCount: recovered.length,
    respondedCount: responded.length,
    activeCount: active.length,
    recoveryRate: missed.length > 0 ? Math.round((recovered.length / missed.length) * 100) : 0,
    responseRate: assignments.length > 0 ? Math.round((responded.length / assignments.length) * 100) : 0,
  };
}

export function useLeadDistribution() {
  const { data: assignments = [] } = useLeadAssignments();

  const distribution = assignments.reduce<Record<string, number>>((acc, a) => {
    acc[a.assigned_to] = (acc[a.assigned_to] || 0) + 1;
    return acc;
  }, {});

  return distribution;
}
