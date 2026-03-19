import { useMemo } from "react";
import { useProfile } from "@/hooks/useCard";
import { useEffectivePlan } from "@/hooks/useBetaAccess";
import { getPlanLimits, isLimitReached, type PlanLimits, type PlanKey } from "@/lib/plans";

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

  return { planKey, limits, checkLimit, hasFeature, profile, isBeta, betaExpiryDate };
}
