import { describe, expect, it } from "vitest";
import { tierOf, tierName, tierPrice, tierAtLeast, KEY_FOR_TIER } from "@/lib/planTiers";
import * as server from "../../supabase/functions/_shared/planTiers";
import { getPlanByKey, getPlanLimits, getNextTier, showsBranding, AI_LIMITS } from "@/lib/plans";
import { getPlanConfig, getNextPlan, PLAN_CONFIGS, UPGRADE_SCENARIOS } from "@/modules/billing/config/planLimits";
import { PLAN_DISPLAY } from "@/modules/billing/config/planDisplay";
import { planHasOnlinePayments } from "../../supabase/functions/_shared/paymentLinks";
import { isPortalFeatureEnabled } from "@/modules/client/components/PortalPlanGate";
import { canAccessBlock, MARKETPLACE_BLOCKS } from "@/lib/blockMarketplace";
import { canonicalSubscriptionKey } from "@/modules/marketplace/hooks/useBusinessPlanStatus";

const cases = [
  ["free", "free", "Free", 0, 3, false, false, 1, 5],
  ["starter", "free", "Free", 0, 3, false, false, 1, 5],
  ["growth", "pro", "Pro", 39, -1, true, false, 1, 50],
  ["pro", "ultra", "Ultra", 79, -1, true, true, 3, 500],
  ["pro_plus", "ultra", "Ultra", 79, -1, true, true, 3, 500],
  ["business", "ultra", "Ultra", 79, -1, true, true, 3, 500],
  ["agency", "agency", "Agency", 279, -1, true, true, -1, -1],
  ["", "free", "Free", 0, 3, false, false, 1, 5],
  ["unknown", "free", "Free", 0, 3, false, false, 1, 5],
] as const;

describe.each(cases)("saved key %s", (key, tier, name, price, services, paid, advanced, team, ai) => {
  it("resolves the canonical tier and saved purchase key", () => {
    expect(tierOf(key)).toBe(tier);
    expect(KEY_FOR_TIER[tier]).toBe(tier === "pro" ? "growth" : tier === "ultra" ? "pro" : tier);
    expect(tierAtLeast(key, "pro")).toBe(paid);
    expect(tierAtLeast(key, "ultra")).toBe(advanced);
  });
  it("uses the agreed USD monthly price and identity", () => {
    expect(tierName(key)).toBe(name);
    expect(tierPrice(tierOf(key))).toBe(price);
    expect(getPlanByKey(key)?.name).toBe(name);
    expect(getPlanByKey(key)?.price).toBe(price);
    const display = PLAN_DISPLAY.find(plan => plan.key === KEY_FOR_TIER[tier]);
    expect(display?.name).toBe(name);
    expect(display?.price).toBe(price);
    expect(display?.status).toBe(paid ? "coming_soon" : "available");
  });
  it("enforces the agreed service capacity in both definitions and display", () => {
    expect(getPlanLimits(key).booking_services).toBe(services);
    expect(getPlanConfig(key).limits.services).toBe(services);
    expect(PLAN_DISPLAY.find(plan => plan.key === KEY_FOR_TIER[tier])?.features.find(feature => feature.key === "services")?.value).toBe(services === -1 ? "Unlimited" : "3");
  });
  it("enforces branding and online payments for paid tiers", () => {
    expect(showsBranding(key)).toBe(!paid);
    expect(getPlanConfig(key).features.removeBranding).toBe(paid);
    expect(getPlanConfig(key).features.online_invoice_payments).toBe(paid);
    expect(planHasOnlinePayments(key)).toBe(paid);
  });
  it("enforces advanced analytics, team capacity and monthly AI requests", () => {
    expect(getPlanConfig(key).features.advancedAnalytics).toBe(advanced);
    expect(getPlanLimits(key).advanced_reporting).toBe(advanced);
    expect(getPlanLimits(key).team_members).toBe(team);
    expect(getPlanLimits(key).ai_requests_monthly).toBe(ai);
    expect(AI_LIMITS[key]).toBe(ai);
    const features = PLAN_DISPLAY.find(plan => plan.key === KEY_FOR_TIER[tier])?.features;
    expect(features?.find(feature => feature.key === "advancedAnalytics")?.value).toBe(advanced);
    expect(features?.find(feature => feature.key === "onlinePayments")?.value).toBe(paid);
    expect(features?.find(feature => feature.key === "team")?.value).toBe(team === -1 ? "Unlimited" : String(team));
    expect(features?.find(feature => feature.key === "ai")?.value).toBe(ai === -1 ? "Unlimited" : String(ai));
  });
  it("agrees with the edge helper for every alias", () => {
    expect(server.tierOf(key)).toBe(tier);
    expect(server.tierName(key)).toBe(name);
    expect(server.tierPrice(server.tierOf(key))).toBe(price);
    expect(server.tierAtLeast(key, "pro")).toBe(paid);
    expect(server.KEY_FOR_TIER[tier]).toBe(KEY_FOR_TIER[tier]);
  });
  it("uses the correct next saved key", () => {
    const next = tier === "free" ? "growth" : tier === "pro" ? "pro" : "agency";
    expect(getNextPlan(key)).toBe(next);
    expect(getNextTier(key)?.key ?? null).toBe(tier === "agency" ? null : next);
  });
  it("applies portal and card block permissions to aliases", () => {
    expect(isPortalFeatureEnabled(key, "cancel")).toBe(true);
    expect(isPortalFeatureEnabled(key, "review")).toBe(paid);
    expect(isPortalFeatureEnabled(key, "invoices")).toBe(advanced);
    const block = MARKETPLACE_BLOCKS.find(item => item.id === "ai_content");
    expect(block).toBeDefined();
    if (!block) throw new Error("Missing AI block");
    expect(canAccessBlock(block, key)).toBe(advanced);
  });
});

it("Agency enables every flag and has unlimited numeric capacity", () => {
  expect(Object.values(PLAN_CONFIGS.agency.features).every(value => value === true)).toBe(true);
  expect(Object.values(getPlanLimits("agency")).every(value => typeof value === "boolean" ? value === true : value === -1)).toBe(true);
});
it("suggests growth for Pro upgrades and pro for higher visibility", () => {
  expect(UPGRADE_SCENARIOS.visibility.suggestedPlan).toBe("pro");
  for (const trigger of ["service_limit", "booking_limit", "branding", "analytics", "reviews", "lead_management", "generic"] as const) {
    expect(UPGRADE_SCENARIOS[trigger].suggestedPlan).toBe("growth");
  }
});
it("preserves historical subscription identity without rewriting saved accounts", () => {
  expect(canonicalSubscriptionKey("pro")).toBe("growth");
  expect(canonicalSubscriptionKey("growth")).toBe("pro");
  expect(canonicalSubscriptionKey("free")).toBe("free");
});