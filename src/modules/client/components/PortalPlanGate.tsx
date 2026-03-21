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
  | "file_sharing"
  | "loyalty"
  | "whatsapp_chat";

const FEATURE_TIERS: Record<PortalFeature, string[]> = {
  cancel: ["starter", "growth", "pro", "agency"],         // All plans
  reschedule: ["growth", "pro", "agency"],                // Pro+
  review: ["growth", "pro", "agency"],                    // Pro+
  loyalty: ["growth", "pro", "agency"],                   // Pro+
  whatsapp_chat: ["growth", "pro", "agency"],             // Pro+
  invoices: ["pro", "agency"],                            // Pro Plus+
  messaging: ["pro", "agency"],                           // Pro Plus+
  payments: ["pro", "agency"],                            // Pro Plus+
  file_sharing: ["pro", "agency"],                        // Pro Plus+
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
