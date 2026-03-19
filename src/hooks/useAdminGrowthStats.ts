import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GrowthKPIs {
  newUsers7d: number;
  activatedUsers: number;
  totalUsers: number;
  leads30d: number;
  totalLeads: number;
  jobRequests30d: number;
  totalJobRequests: number;
  responseRate: number;
}

export interface GrowthFunnel {
  outreach: number;
  signups: number;
  activated: number;
  leads: number;
  wins: number;
}

export interface MarketplaceHealth {
  activeBusinesses: number;
  onDutyUsers: number;
  totalRequests: number;
  avgResponses: number;
}

export interface ActivityItem {
  type: "signup" | "job_request" | "response";
  title: string;
  timestamp: string;
  meta: Record<string, string>;
}

export interface ReferralMetrics {
  total: number;
  activated: number;
  rewardsIssued: number;
  totalRewardDays: number;
}

export interface AdminGrowthData {
  kpis: GrowthKPIs;
  funnel: GrowthFunnel;
  marketplace: MarketplaceHealth;
  referrals: ReferralMetrics;
  signupsByDate: Record<string, number>;
  planCounts: Record<string, number>;
  activityFeed: ActivityItem[];
}

export function useAdminGrowthStats() {
  return useQuery<AdminGrowthData>({
    queryKey: ["admin-growth-stats"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("admin-growth-stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw new Error(res.error.message || "Failed to fetch growth stats");
      return res.data as AdminGrowthData;
    },
  });
}

export interface OutreachContact {
  id: string;
  name: string;
  business: string | null;
  status: string;
  last_contact_at: string | null;
  notes: string | null;
  created_at: string;
}

export function useOutreachContacts() {
  const qc = useQueryClient();

  const query = useQuery<OutreachContact[]>({
    queryKey: ["outreach-contacts"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outreach_contacts")
        .select("id, name, business, status, last_contact_at, notes, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as OutreachContact[];
    },
  });

  const addContact = useMutation({
    mutationFn: async (contact: { name: string; business?: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("outreach_contacts").insert({
        ...contact,
        created_by: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outreach-contacts"] }),
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; notes?: string; last_contact_at?: string }) => {
      const { error } = await supabase
        .from("outreach_contacts")
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outreach-contacts"] }),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("outreach_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outreach-contacts"] }),
  });

  return { ...query, addContact, updateContact, deleteContact };
}
