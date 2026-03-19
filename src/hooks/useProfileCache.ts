import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CachedProfile {
  handle: string | null;
  name: string | null;
  avatar_url: string | null;
  plan: string | null;
  tour_completed: boolean;
  onboarding_completed: boolean;
  current_org_id: string | null;
}

/**
 * Single consolidated profile query — replaces 5+ separate profile fetches
 * that were each hitting the DB independently on every page load.
 *
 * Consumers: AppSidebar, TopBar, ProtectedRoute, OrgContext, ProductTour, UpgradeTriggers, etc.
 */
export function useProfileCache() {
  const { user } = useAuth();
  return useQuery<CachedProfile | null>({
    queryKey: ["profile-cache", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("handle, name, avatar_url, plan, tour_completed, onboarding_completed, current_org_id")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as CachedProfile | null;
    },
  });
}
