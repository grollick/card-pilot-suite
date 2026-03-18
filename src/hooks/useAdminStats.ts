import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  totalUsers: number;
  signups30d: number;
  signups7d: number;
  signupsPrev30d: number;
  planCounts: Record<string, number>;
  totalCards: number;
  publishedCards: number;
  totalCardViews30d: number;
  leads30d: number;
  bookings30d: number;
  recentSignups: {
    id: string;
    name: string | null;
    email: string | null;
    plan: string | null;
    created_at: string;
    handle: string | null;
  }[];
  signupsByDate: Record<string, number>;
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("admin-stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw new Error(res.error.message || "Failed to fetch admin stats");
      return res.data as AdminStats;
    },
  });
}

export function useIsAdmin() {
  return useQuery<boolean>({
    queryKey: ["is-admin"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      return !!data;
    },
  });
}
