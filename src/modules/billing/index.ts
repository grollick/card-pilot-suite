// ── Billing module barrel ──
export { usePlanLimits } from "@/hooks/usePlanLimits";
export {
  getPlanLimits,
  isLimitReached,
  showsBranding,
  PLAN_TIERS,
  type PlanLimits,
  type PlanKey,
} from "@/lib/plans";
