import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type AppCategory = "payments" | "accounting" | "marketing" | "automation" | "analytics" | "industry_tools" | "communication" | "productivity";
export type AppPricingType = "free" | "paid_once" | "subscription";

export interface MarketplaceApp {
  id: string;
  name: string;
  slug: string;
  developer_name: string;
  description: string;
  long_description: string | null;
  icon_url: string | null;
  screenshot_urls: string[];
  category: AppCategory;
  pricing_type: AppPricingType;
  price_amount: number;
  features: string[];
  permissions: string[];
  config_schema: Record<string, unknown>;
  is_featured: boolean;
  is_published: boolean;
  avg_rating: number;
  install_count: number;
  created_at: string;
}

export interface InstalledApp {
  id: string;
  user_id: string;
  app_id: string;
  enabled: boolean;
  config: Record<string, unknown>;
  installed_at: string;
  marketplace_apps?: MarketplaceApp;
}

export function useMarketplaceApps(category?: AppCategory) {
  return useQuery({
    queryKey: ["marketplace-apps", category],
    queryFn: async () => {
      let q = supabase.from("marketplace_apps").select("*").eq("is_published", true).order("install_count", { ascending: false });
      if (category) q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as MarketplaceApp[];
    },
  });
}

export function useFeaturedApps() {
  return useQuery({
    queryKey: ["marketplace-apps-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_apps")
        .select("*")
        .eq("is_published", true)
        .eq("is_featured", true)
        .order("install_count", { ascending: false });
      if (error) throw error;
      return data as unknown as MarketplaceApp[];
    },
  });
}

export function useInstalledApps() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["installed-apps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("installed_apps")
        .select("*, marketplace_apps(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as unknown as InstalledApp[];
    },
  });
}

export function useInstallApp() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (appId: string) => {
      const { error } = await supabase.from("installed_apps").insert({ user_id: user!.id, app_id: appId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["installed-apps"] });
      toast.success("App installed successfully!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUninstallApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (installedAppId: string) => {
      const { error } = await supabase.from("installed_apps").delete().eq("id", installedAppId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["installed-apps"] });
      toast.success("App removed.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("installed_apps").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["installed-apps"] });
    },
  });
}

export function useAppReviews(appId: string) {
  return useQuery({
    queryKey: ["app-reviews", appId],
    enabled: !!appId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_reviews")
        .select("*")
        .eq("app_id", appId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSubmitAppReview() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ appId, rating, reviewText }: { appId: string; rating: number; reviewText: string }) => {
      const { error } = await supabase.from("app_reviews").upsert(
        { app_id: appId, user_id: user!.id, rating, review_text: reviewText },
        { onConflict: "user_id,app_id" }
      );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["app-reviews", vars.appId] });
      toast.success("Review submitted!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
