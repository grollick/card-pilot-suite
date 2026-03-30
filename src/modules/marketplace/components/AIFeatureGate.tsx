import { Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FEATURE_LABELS: Record<string, { label: string; plan: string }> = {
  follow_up: { label: "Follow-up suggestions", plan: "Pro" },
  profile_rewrite: { label: "Profile rewrite assistant", plan: "Pro" },
  advanced_growth: { label: "Advanced growth insights", plan: "Growth" },
};

interface Props {
  feature: string;
  children: React.ReactNode;
  enabled?: boolean;
}

export default function AIFeatureGate({ feature, children, enabled }: Props) {
  const navigate = useNavigate();

  if (enabled) return <>{children}</>;

  const info = FEATURE_LABELS[feature] || { label: feature, plan: "Pro" };

  return (
    <div className="relative rounded-xl border border-border bg-card overflow-hidden">
      <div className="absolute inset-0 bg-card/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted mb-3">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground text-center mb-1">
          {info.label} available on {info.plan}
        </p>
        <p className="text-xs text-muted-foreground text-center mb-3">
          Upgrade to unlock this feature and grow faster.
        </p>
        <Button size="sm" className="gap-1" onClick={() => navigate("/pricing")}>
          <Zap className="h-3.5 w-3.5" /> Upgrade
        </Button>
      </div>
      <div className="opacity-30 pointer-events-none">
        {children}
      </div>
    </div>
  );
}
