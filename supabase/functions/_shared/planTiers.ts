/**
 * Display | USD/month | Saved key | Aliases
 * Free    | 0         | free      | starter
 * Pro     | 39        | growth    | none
 * Ultra   | 79        | pro       | pro_plus, business
 * Agency  | 279       | agency    | none
 * WARNING: the saved key `pro` means ULTRA, not the displayed Pro tier.
 */
export type PlanTier = "free" | "pro" | "ultra" | "agency";
export const KEY_FOR_TIER = { free: "free", pro: "growth", ultra: "pro", agency: "agency" } as const;
const TIERS: PlanTier[] = ["free", "pro", "ultra", "agency"];
const NAMES: Record<PlanTier, string> = { free: "Free", pro: "Pro", ultra: "Ultra", agency: "Agency" };
const PRICES: Record<PlanTier, number> = { free: 0, pro: 39, ultra: 79, agency: 279 };
export function tierOf(planKey?: string | null): PlanTier {
  switch (planKey) {
    case "growth": return "pro";
    case "pro": case "pro_plus": case "business": return "ultra";
    case "agency": return "agency";
    default: return "free";
  }
}
export const tierName = (planKey?: string | null): string => NAMES[tierOf(planKey)];
export const tierPrice = (tier: PlanTier): number => PRICES[tier];
export const tierAtLeast = (planKey: string | null | undefined, tier: PlanTier): boolean => TIERS.indexOf(tierOf(planKey)) >= TIERS.indexOf(tier);