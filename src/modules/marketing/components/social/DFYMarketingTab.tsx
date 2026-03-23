import { useState, useCallback, useEffect } from "react";
import { Rocket, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import DFYSetupWizard, { type DFYConfig } from "./DFYSetupWizard";
import DFYMarketingDashboard from "./DFYMarketingDashboard";
import { useAutoCampaigns, useCreateCampaign, useDeleteCampaign } from "@/hooks/useAutoCampaigns";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { toast } from "sonner";

interface Props {
  onSwitchToCalendar: () => void;
}

export default function DFYMarketingTab({ onSwitchToCalendar }: Props) {
  const { data: campaigns = [], isLoading } = useAutoCampaigns();
  const createCampaign = useCreateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const { planKey } = usePlanLimits();
  const [activating, setActivating] = useState(false);

  const dfyCampaign = campaigns.find(c => c.campaign_type === "dfy_marketing");
  const isSetUp = !!dfyCampaign;

  const isFree = planKey === "starter";
  const isProPlus = planKey === "pro" || planKey === "agency";

  const handleActivate = useCallback(async (config: DFYConfig) => {
    setActivating(true);
    try {
      // Map DFY content types to campaign content types
      const contentMap: Record<string, string> = {
        promotions: "promotion",
        testimonials: "testimonial",
        before_after: "project_completed",
        tips: "tip",
      };
      const contentTypes = config.contentTypes.map(ct => contentMap[ct] || ct);
      const freqMap: Record<string, number> = { "3x_week": 3, "5x_week": 5, "daily": 7 };
      const postsPerWeek = freqMap[config.frequency] || 3;

      // Cap for Pro plan
      const cappedPosts = !isProPlus ? Math.min(postsPerWeek, 3) : postsPerWeek;

      await createCampaign.mutateAsync({
        name: "Done-For-You Marketing",
        campaign_type: "dfy_marketing",
        frequency: config.frequency,
        posts_per_week: cappedPosts,
        content_types: contentTypes,
        settings_json: { goal: config.goal, dfy: true },
      });
      toast.success("Done-For-You Marketing is now active! 🚀");
    } catch (e: any) {
      toast.error(e.message || "Failed to activate");
    } finally {
      setActivating(false);
    }
  }, [createCampaign, isProPlus]);

  const handleDeactivate = useCallback(async () => {
    if (!dfyCampaign) return;
    await deleteCampaign.mutateAsync(dfyCampaign.id);
    toast.success("Done-For-You Marketing deactivated");
  }, [dfyCampaign, deleteCampaign]);

  // Free plan gate
  if (isFree) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Rocket className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">Done-For-You Marketing</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Let AI handle your social media marketing — generate content, schedule posts, and grow your leads on autopilot.
        </p>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 mb-6 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Available on Pro plans</span>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-primary" /> Pro: Limited automation (3 posts/week)</li>
            <li className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-primary" /> Pro Plus: Full automation + AI optimization + weekly reports</li>
          </ul>
        </div>
        <Button onClick={() => window.location.href = "/pricing"} className="gap-2">
          <Crown className="h-4 w-4" /> Upgrade to Pro
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  // Not yet set up — show wizard
  if (!isSetUp) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8">
        <div className="text-center mb-10">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Rocket className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold mb-1">Done-For-You Marketing</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Set up automated social media marketing in 3 steps. AI will generate, schedule, and publish content tailored to your trade.
          </p>
          {!isProPlus && (
            <p className="text-[11px] text-amber-600 mt-2">
              Pro plan: limited to 3 posts/week. Upgrade to Pro Plus for full automation.
            </p>
          )}
        </div>
        <DFYSetupWizard onComplete={handleActivate} loading={activating} />
      </motion.div>
    );
  }

  // Active — show dashboard
  return (
    <DFYMarketingDashboard
      onDeactivate={handleDeactivate}
      onViewScheduled={onSwitchToCalendar}
    />
  );
}
