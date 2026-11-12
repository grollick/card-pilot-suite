import { PLAN_CONFIGS } from "@/modules/billing/config/planLimits";

/** How many services a new account starts with: the Free plan's service limit. */
export const NEW_ACCOUNT_SERVICE_CAP: number = PLAN_CONFIGS.free.limits.services;

export function capServices<T>(list: T[] | null | undefined, cap: number = NEW_ACCOUNT_SERVICE_CAP): T[] {
  const arr = list || [];
  return cap < 0 ? arr : arr.slice(0, cap);
}
