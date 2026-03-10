import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export type TeamRole = "owner" | "admin" | "manager" | "technician" | "office_staff" | "member";

export const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  technician: "Technician",
  office_staff: "Office Staff",
  member: "Member",
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "Full access, billing, and team management",
  admin: "Full access except billing",
  manager: "Manage jobs, estimates, leads, and assign work",
  technician: "View assigned jobs, add notes and photos",
  office_staff: "Manage CRM, estimates, invoices, and bookings",
  member: "Basic read access",
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ["dashboard", "leads", "jobs", "estimates", "invoices", "marketing", "settings", "team", "billing", "assign_jobs"],
  admin: ["dashboard", "leads", "jobs", "estimates", "invoices", "marketing", "settings", "team", "assign_jobs"],
  manager: ["dashboard", "leads", "jobs", "estimates", "invoices", "assign_jobs"],
  technician: ["tech_dashboard", "my_jobs"],
  office_staff: ["dashboard", "leads", "estimates", "invoices", "bookings"],
  member: ["dashboard"],
};

export interface TeamMember {
  id: string;
  org_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  profile?: {
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export function useTeamMembers() {
  const { currentOrg } = useOrg();
  return useQuery({
    queryKey: ["team-members", currentOrg?.id],
    enabled: !!currentOrg,
    queryFn: async () => {
      const { data: members, error } = await supabase
        .from("organization_members")
        .select("id, org_id, user_id, role, joined_at")
        .eq("org_id", currentOrg!.id);
      if (error) throw error;

      // Fetch profiles for each member
      const userIds = members.map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      return members.map((m: any) => ({
        ...m,
        role: m.role as TeamRole,
        profile: profileMap.get(m.user_id) || null,
      })) as TeamMember[];
    },
  });
}

export function useMyOrgRole(): TeamRole | null {
  const { user } = useAuth();
  const { members } = useOrg();
  const myMembership = members.find((m) => m.user_id === user?.id);
  return (myMembership?.role as TeamRole) || null;
}

export function useHasPermission(permission: string): boolean {
  const role = useMyOrgRole();
  if (!role) return true; // No org = solo user, full access
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function useAssignJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, userId }: { jobId: string; userId: string | null }) => {
      const { error } = await supabase
        .from("jobs")
        .update({ assigned_to_user_id: userId } as any)
        .eq("id", jobId);
      if (error) throw error;

      // Create notification if assigning
      if (userId) {
        await supabase.from("notifications" as any).insert({
          user_id: userId,
          title: "New job assigned to you",
          type: "job_assigned",
          related_id: jobId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job"] });
      toast.success("Job assignment updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useMyAssignedJobs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-assigned-jobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("jobs")
        .select("id, title, job_number, status, job_type, job_address, scheduled_start, scheduled_end, actual_start, actual_end, notes, lead_id, leads(name, phone, email)") as any)
        .eq("assigned_to_user_id", user!.id)
        .in("status", ["scheduled", "in_progress", "paused"])
        .order("scheduled_start", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications" as any).update({ read_at: new Date().toISOString() }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase
        .from("notifications" as any)
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user!.id)
        .is("read_at", null);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return { ...query, markRead, markAllRead };
}

export function useTeamPerformance() {
  const { currentOrg } = useOrg();
  return useQuery({
    queryKey: ["team-performance", currentOrg?.id],
    enabled: !!currentOrg,
    queryFn: async () => {
      // Get all org members
      const { data: members } = await supabase
        .from("organization_members")
        .select("user_id, role")
        .eq("org_id", currentOrg!.id);

      if (!members || members.length === 0) return [];

      const userIds = members.map((m: any) => m.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", userIds);

      // Get jobs for these users
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, status, assigned_to_user_id, scheduled_start")
        .in("assigned_to_user_id" as any, userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      return members.map((m: any) => {
        const memberJobs = (jobs || []).filter((j: any) => j.assigned_to_user_id === m.user_id);
        return {
          user_id: m.user_id,
          role: m.role,
          name: profileMap.get(m.user_id)?.name || "Unknown",
          avatar_url: profileMap.get(m.user_id)?.avatar_url,
          jobs_completed: memberJobs.filter((j: any) => j.status === "completed").length,
          jobs_scheduled: memberJobs.filter((j: any) => j.status === "scheduled").length,
          jobs_in_progress: memberJobs.filter((j: any) => j.status === "in_progress").length,
          total_jobs: memberJobs.length,
        };
      });
    },
  });
}
