import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProviderBusiness } from "./useProviderInsights";

/** Real services for the current business */
export function useBusinessServices() {
  const { data: business } = useProviderBusiness();
  const businessId = business?.id;
  return useQuery({
    queryKey: ["business-services", businessId],
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, service_name, description, price_amount, is_active")
        .eq("business_id", businessId!)
        .order("service_name");
      if (error) throw error;
      return (data || []).map((s) => ({
        id: s.id,
        title: s.service_name,
        price: s.price_amount,
        active: s.is_active ?? true,
      }));
    },
  });
}

/** Real service areas for the current business */
export function useBusinessAreas() {
  const { data: business } = useProviderBusiness();
  const businessId = business?.id;
  return useQuery({
    queryKey: ["business-areas", businessId],
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_areas")
        .select("id, city, region, is_active")
        .eq("business_id", businessId!)
        .eq("is_active", true)
        .order("city");
      if (error) throw error;
      return data || [];
    },
  });
}

/** Real categories for the current business */
export function useBusinessCategories() {
  const { data: business } = useProviderBusiness();
  const businessId = business?.id;
  return useQuery({
    queryKey: ["business-categories", businessId],
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_categories")
        .select("id, category_key")
        .eq("business_id", businessId!);
      if (error) throw error;
      return (data || []).map((c) => ({
        key: c.category_key,
        label: c.category_key.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        selected: true,
      }));
    },
  });
}

/** Real marketplace performance metrics */
export function useMarketplaceMetrics() {
  const { data: business } = useProviderBusiness();
  const businessId = business?.id;
  return useQuery({
    queryKey: ["marketplace-metrics", businessId],
    enabled: !!businessId,
    staleTime: 1000 * 60 * 3,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_metrics")
        .select("*")
        .eq("business_id", businessId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Profile completeness from copilot_profile_context */
export function useProfileCompleteness() {
  const { data: business } = useProviderBusiness();
  const businessId = business?.id;
  return useQuery({
    queryKey: ["profile-completeness", businessId],
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("copilot_profile_context" as any)
        .select("*")
        .eq("business_id", businessId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { percent: 0, tips: [] as { done: boolean; label: string }[] };

      const d = data as any;
      const tips = [
        { done: !!d.logo_url, label: "Upload a logo" },
        { done: (d.service_count ?? 0) >= 3, label: "Add at least 3 services" },
        { done: !!d.bio, label: "Complete your profile bio" },
        { done: !!d.headline, label: "Add a headline" },
        { done: (d.service_area_count ?? 0) >= 1, label: "Set service areas" },
      ];
      const doneCount = tips.filter((t) => t.done).length;
      return { percent: Math.round((doneCount / tips.length) * 100), tips };
    },
  });
}
