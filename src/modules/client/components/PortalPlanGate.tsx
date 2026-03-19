import { Lock } from "lucide-react";

/**
 * Portal feature tiers based on the BUSINESS OWNER's plan.
 * Free: basic portal access (view bookings)
 * Pro (growth): rescheduling + review submission
 * Pro Plus (scale): payments, invoices, messaging, file sharing
 */

export type PortalFeature =
  | "reschedule"
  | "review"
  | "cancel"
  | "invoices"
  | "messaging"
  | "payments"
  | "file_sharing";

const FEATURE_TIERS: Record<PortalFeature, string[]> = {
  cancel: ["starter", "growth", "scale", "agency"],      // All plans
  reschedule: ["growth", "scale", "agency"],              // Pro+
  review: ["growth", "scale", "agency"],                  // Pro+
  invoices: ["scale", "agency"],                          // Pro Plus+
  messaging: ["scale", "agency"],                         // Pro Plus+
  payments: ["scale", "agency"],                          // Pro Plus+
  file_sharing: ["scale", "agency"],                      // Pro Plus+
};

export function isPortalFeatureEnabled(businessPlan: string, feature: PortalFeature): boolean {
  const allowed = FEATURE_TIERS[feature] || [];
  return allowed.includes(businessPlan || "starter");
}

export function PortalUpgradeNotice({ feature }: { feature: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
      <Lock className="h-3.5 w-3.5 shrink-0" />
      <span>This feature requires your service provider to upgrade their plan.</span>
    </div>
  );
}
