import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BetaAccess {
  id: string;
  user_id: string;
  granted_plan: string;
  start_date: string;
  expiry_date: string;
  is_active: boolean;
  notes: string | null;
  created_by_admin: string | null;
  created_at: string;
  updated_at: string;
}

export interface EffectivePlan {
  plan: string;
  is_beta: boolean;
  beta_id: string | null;
  expiry_date: string | null;
}

/** Get effective plan for current user (checks beta override) */
export function useEffectivePlan() {
  const { user } = useAuth();
  return useQuery<EffectivePlan>({
    queryKey: ["effective-plan", user?.id],
    enabled: !!user,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_effective_plan", {
        p_user_id: user!.id,
      });
      if (error) throw error;
      return data as unknown as EffectivePlan;
    },
  });
}

/** Get current user's beta access record */
export function useMyBetaAccess() {
  const { user } = useAuth();
  return useQuery<BetaAccess | null>({
    queryKey: ["my-beta-access", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beta_access")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("expiry_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as BetaAccess | null;
    },
  });
}

/** Admin: list all beta access records */
export function useAdminBetaList() {
  return useQuery<(BetaAccess & { user_email?: string; user_name?: string })[]>({
    queryKey: ["admin-beta-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beta_access")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profile info for each unique user
      const userIds = [...new Set((data as BetaAccess[]).map((b) => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

      return (data as BetaAccess[]).map((b) => {
        const prof = profileMap.get(b.user_id);
        return { ...b, user_email: prof?.email ?? undefined, user_name: prof?.name ?? undefined };
      });
    },
  });
}

/** Admin: create beta access */
export function useCreateBetaAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      user_id: string;
      granted_plan: string;
      expiry_date: string;
      notes?: string;
      admin_id: string;
    }) => {
      const { data, error } = await supabase
        .from("beta_access")
        .insert({
          user_id: params.user_id,
          granted_plan: params.granted_plan,
          expiry_date: params.expiry_date,
          notes: params.notes ?? null,
          created_by_admin: params.admin_id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-beta-list"] });
      toast.success("Beta access granted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Admin: update beta access (extend/revoke) */
export function useUpdateBetaAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; is_active?: boolean; expiry_date?: string; notes?: string }) => {
      const updates: Record<string, unknown> = {};
      if (params.is_active !== undefined) updates.is_active = params.is_active;
      if (params.expiry_date) updates.expiry_date = params.expiry_date;
      if (params.notes !== undefined) updates.notes = params.notes;

      const { error } = await supabase.from("beta_access").update(updates).eq("id", params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-beta-list"] });
      toast.success("Beta access updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
