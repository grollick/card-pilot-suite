import { tierAtLeast, type PlanTier } from "@/lib/planTiers";
import { Lock } from "lucide-react";

/**
 * Portal feature tiers based on the BUSINESS OWNER's plan.
 * Free: basic portal access (view bookings)
 * Pro (growth): rescheduling + review submission
 * Ultra (pro): payments, invoices, messaging, file sharing
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

const FEATURE_TIERS: Record<PortalFeature, PlanTier> = {
  cancel: "free", reschedule: "pro", review: "pro", loyalty: "pro", whatsapp_chat: "pro",
  invoices: "ultra", messaging: "ultra", payments: "ultra", file_sharing: "ultra",
};

export function isPortalFeatureEnabled(businessPlan: string, feature: PortalFeature): boolean {
  const minimum = FEATURE_TIERS[feature];
  return minimum !== undefined && tierAtLeast(businessPlan, minimum);
}

export function PortalUpgradeNotice({ feature }: { feature: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
      <Lock className="h-3.5 w-3.5 shrink-0" />
      <span>This feature requires your service provider to upgrade their plan.</span>
    </div>
  );
}
