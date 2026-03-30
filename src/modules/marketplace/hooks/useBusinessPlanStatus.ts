import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessPlanStatus {
  business_id: string;
  plan_name: string;
  max_services: number | null;
  max_bookings_per_month: number | null;
  max_service_areas: number | null;
  branding_removed: boolean;
  featured_enabled: boolean;
}

const DEFAULT_FREE: BusinessPlanStatus = {
  business_id: "",
  plan_name: "free",
  max_services: 3,
  max_bookings_per_month: 10,
  max_service_areas: 1,
  branding_removed: false,
  featured_enabled: false,
};

export type LimitKind = "services" | "bookings" | "service_areas";

export function useBusinessPlanStatus(businessId: string | undefined) {
  const query = useQuery({
    queryKey: ["business_plan_status", businessId],
    queryFn: async () => {
      if (!businessId) return DEFAULT_FREE;
      const { data, error } = await supabase
        .from("business_plan_status")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { ...DEFAULT_FREE, business_id: businessId };
      return {
        business_id: data.business_id ?? businessId,
        plan_name: data.plan_name ?? "free",
        max_services: data.max_services,
        max_bookings_per_month: data.max_bookings_per_month,
        max_service_areas: data.max_service_areas,
        branding_removed: data.branding_removed ?? false,
        featured_enabled: data.featured_enabled ?? false,
      } as BusinessPlanStatus;
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
  });

  const plan = query.data ?? DEFAULT_FREE;

  /** Returns true if the current count has reached or exceeded the limit. null limit = unlimited. */
  function isLimitReached(kind: LimitKind, currentCount: number): boolean {
    const limit =
      kind === "services"
        ? plan.max_services
        : kind === "bookings"
        ? plan.max_bookings_per_month
        : plan.max_service_areas;
    if (limit === null) return false; // unlimited
    return currentCount >= limit;
  }

  /** Returns the limit number for display, or null if unlimited */
  function getLimit(kind: LimitKind): number | null {
    if (kind === "services") return plan.max_services;
    if (kind === "bookings") return plan.max_bookings_per_month;
    return plan.max_service_areas;
  }

  return {
    plan,
    isLoading: query.isLoading,
    isLimitReached,
    getLimit,
  };
}
