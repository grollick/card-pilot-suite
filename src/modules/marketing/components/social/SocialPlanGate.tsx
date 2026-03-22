import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useSocialPosts } from "@/hooks/useSocialPosts";
import { useNavigate } from "react-router-dom";
import type { PlanLimits } from "@/lib/plans";

interface GateProps {
  feature: keyof PlanLimits;
  children: React.ReactNode;
  label?: string;
  description?: string;
}

/**
 * Gates social features based on the user's plan.
 * Shows an upgrade prompt if the feature is not available.
 */
export function SocialFeatureGate({ feature, children, label, description }: GateProps) {
  const { hasFeature } = usePlanLimits();
  const navigate = useNavigate();

  if (hasFeature(feature)) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        <Lock className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-lg font-bold mb-1">{label || "Feature Locked"}</h3>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        {description || "Upgrade your plan to unlock this feature and grow your social presence."}
      </p>
      <Button onClick={() => navigate("/pricing")} className="gap-2">
        <Crown className="h-4 w-4" /> Upgrade Plan
      </Button>
    </div>
  );
}

/**
 * Hook to check social post limits for the current month.
 */
export function useSocialPostLimits() {
  const { limits, planKey } = usePlanLimits();
  const { data: posts = [] } = useSocialPosts();

  const monthlyLimit = limits.social_posts_monthly;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const postsThisMonth = posts.filter(p => new Date(p.created_at) >= monthStart).length;
  const isAtLimit = monthlyLimit !== -1 && postsThisMonth >= monthlyLimit;
  const remaining = monthlyLimit === -1 ? Infinity : Math.max(0, monthlyLimit - postsThisMonth);

  return {
    monthlyLimit,
    postsThisMonth,
    isAtLimit,
    remaining,
    platformsMax: limits.social_platforms_max,
    canSchedule: limits.social_scheduling,
    canUseAI: limits.social_ai_tools,
    canViewAnalytics: limits.social_analytics,
    canUseFeed: limits.social_content_feed,
    canUseDFY: limits.social_dfy,
    planKey,
  };
}

/**
 * Inline badge showing a feature is locked.
 */
export function ProBadge({ tier = "Pro" }: { tier?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
      <Crown className="h-2.5 w-2.5" />{tier}
    </span>
  );
}
