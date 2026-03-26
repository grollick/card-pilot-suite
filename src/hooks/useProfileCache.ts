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
  company: string | null;
  avatar_rotation: number;
}

/**
 * Single consolidated profile query — replaces 8+ separate profile fetches
 * that were each hitting the DB independently on every page load.
 *
 * Consumers: AppSidebar, TopBar, ProtectedRoute, OrgContext, ProductTour,
 * UpgradeTriggers, ShareCardWidget, ShareMessageCard, RevenueQuickActions, etc.
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
        .select("handle, name, avatar_url, plan, tour_completed, onboarding_completed, current_org_id, company")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;

      // Get avatar rotation from the user's card theme_json
      let avatarRotation = 0;
      const { data: card } = await supabase
        .from("cards")
        .select("theme_json")
        .eq("user_id", user!.id)
        .eq("is_team_card", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (card?.theme_json && typeof (card.theme_json as any).avatar_rotation === "number") {
        avatarRotation = (card.theme_json as any).avatar_rotation;
      }

      return { ...data, avatar_rotation: avatarRotation } as CachedProfile | null;
    },
  });
}
