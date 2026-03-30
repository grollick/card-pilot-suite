import { useMemo } from "react";
import { useProfile } from "@/hooks/useCard";
import { useEffectivePlan } from "@/hooks/useBetaAccess";
import { getPlanLimits, isLimitReached, showsBranding, getNextTier, type PlanLimits, type PlanKey } from "@/lib/plans";
import type { UpgradeTrigger } from "@/modules/billing/config/planLimits";

/**
 * Returns the current user's plan limits and helpers to check them.
 * Now checks beta_access for temporary plan overrides.
 */
export function usePlanLimits() {
  const { data: profile } = useProfile();
  const { data: effectivePlan } = useEffectivePlan();

  const planKey = (effectivePlan?.plan ?? profile?.plan ?? "starter") as PlanKey;
  const isBeta = effectivePlan?.is_beta ?? false;
  const betaExpiryDate = effectivePlan?.expiry_date ?? null;

  const limits: PlanLimits = useMemo(() => getPlanLimits(planKey), [planKey]);

  const checkLimit = (resource: keyof PlanLimits, currentCount: number): boolean => {
    const val = limits[resource];
    if (typeof val === "boolean") return false;
    return isLimitReached(val, currentCount);
  };

  const hasFeature = (feature: keyof PlanLimits): boolean => {
    const val = limits[feature];
    return typeof val === "boolean" ? val : true;
  };

  /** Map a resource or feature to the correct upgrade trigger for UpgradeModal */
  const getUpgradeTrigger = (resource?: keyof PlanLimits, feature?: keyof PlanLimits): UpgradeTrigger => {
    const key = resource ?? feature;
    if (key === "booking_services") return "service_limit";
    if (key === "bookings_monthly") return "booking_limit";
    if (key === "review_requests_monthly" || key === "testimonials") return "reviews";
    if (key === "advanced_reporting") return "analytics";
    return "generic";
  };

  /** Whether the current plan shows guzzl branding */
  const hasBranding = showsBranding(planKey);

  /** Label for the current plan */
  const planLabel = useMemo(() => {
    const labels: Record<string, string> = { starter: "Free", free: "Free", growth: "Pro", pro: "Pro Plus", agency: "Agency" };
    return labels[planKey] ?? "Free";
  }, [planKey]);

  /** Next tier info */
  const nextTier = useMemo(() => getNextTier(planKey), [planKey]);

  return { planKey, planLabel, limits, checkLimit, hasFeature, getUpgradeTrigger, hasBranding, nextTier, profile, isBeta, betaExpiryDate };
}
