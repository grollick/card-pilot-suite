import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UpgradeTrigger } from "@/modules/billing/config/planLimits";

interface UpgradeGateProps {
  locked: boolean;
  trigger: UpgradeTrigger;
  onUpgrade: (trigger: UpgradeTrigger) => void;
  children: React.ReactNode;
  /** Inline banner instead of blocking overlay */
  mode?: "overlay" | "banner";
  /** Custom short message for the banner */
  bannerText?: string;
}

/**
 * Wraps content that requires a plan upgrade.
 * - `overlay` mode: dims children and shows a centered CTA
 * - `banner` mode: shows a subtle top banner above children
 */
export default function UpgradeGate({ locked, trigger, onUpgrade, children, mode = "overlay", bannerText }: UpgradeGateProps) {
  if (!locked) return <>{children}</>;

  if (mode === "banner") {
    return (
      <div>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span className="text-foreground font-medium">
              {bannerText ?? "Upgrade to unlock this feature"}
            </span>
          </div>
          <Button size="sm" variant="default" onClick={() => onUpgrade(trigger)}>
            Upgrade
          </Button>
        </div>
        <div className="opacity-50 pointer-events-none select-none">
          {children}
        </div>
      </div>
    );
  }

  // Overlay mode
  return (
    <div className="relative">
      <div className="opacity-30 pointer-events-none select-none blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-3">
            {bannerText ?? "Upgrade to unlock"}
          </p>
          <Button size="sm" onClick={() => onUpgrade(trigger)}>
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
}
