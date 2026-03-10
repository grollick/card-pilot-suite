import { useMemo } from "react";
import { useProfile } from "@/hooks/useCard";
import { getPlanLimits, isLimitReached, type PlanLimits, type PlanKey } from "@/lib/plans";

/**
 * Returns the current user's plan limits and helpers to check them.
 * Usage:
 *   const { limits, checkLimit, planKey } = usePlanLimits();
 *   if (checkLimit("contacts", contactCount)) { show upgrade prompt }
 */
export function usePlanLimits() {
  const { data: profile } = useProfile();
  const planKey = (profile?.plan ?? "starter") as PlanKey;
  const limits: PlanLimits = useMemo(() => getPlanLimits(planKey), [planKey]);

  const checkLimit = (resource: keyof PlanLimits, currentCount: number): boolean => {
    return isLimitReached(limits[resource], currentCount);
  };

  return { planKey, limits, checkLimit, profile };
}
