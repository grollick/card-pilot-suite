import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, BarChart3, Zap, Eye, Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingStepWrapper from "./OnboardingStepWrapper";

interface Props {
  onUpgrade: () => void;
  onSkip: () => void;
}

const PRO_BENEFITS = [
  { icon: Eye, text: "Priority marketplace visibility", detail: "Show up first in local search" },
  { icon: BarChart3, text: "Advanced analytics", detail: "Track views, leads & conversions" },
  { icon: Zap, text: "AI-powered automation", detail: "Auto follow-ups & smart replies" },
  { icon: TrendingUp, text: "Growth tools", detail: "Social posting & email campaigns" },
];

export default function StepUpgradePrompt({ onUpgrade, onSkip }: Props) {
  return (
    <OnboardingStepWrapper stepKey="upgrade-prompt">
      <div className="text-center space-y-1">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 mb-2"
        >
          <Crown className="h-6 w-6 text-white" />
        </motion.div>
        <h2 className="text-lg font-semibold text-foreground">
          Ready to grow faster?
        </h2>
        <p className="text-sm text-muted-foreground">
          Upgrade to Pro and unlock tools that bring in more customers
        </p>
      </div>

      {/* Benefits list */}
      <div className="space-y-2">
        {PRO_BENEFITS.map((benefit, i) => {
          const Icon = benefit.icon;
          return (
            <motion.div
              key={benefit.text}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{benefit.text}</p>
                <p className="text-xs text-muted-foreground">{benefit.detail}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pricing hint */}
      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 text-center space-y-1">
        <p className="text-xs text-muted-foreground">Starting at</p>
        <p className="text-2xl font-bold text-foreground">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
        <p className="text-xs text-primary font-medium">Cancel anytime · No contracts</p>
      </div>

      <div className="space-y-2">
        <Button onClick={onUpgrade} className="w-full h-12 text-base font-semibold gap-2">
          <Crown className="h-4 w-4" /> Upgrade to Pro
        </Button>
        <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
          Continue with Free plan <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        You're doing great on Free — upgrade anytime from Settings
      </p>
    </OnboardingStepWrapper>
  );
}
