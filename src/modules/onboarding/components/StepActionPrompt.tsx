import { motion } from "framer-motion";
import { ArrowRight, Radio, MessageSquare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingStepWrapper from "./OnboardingStepWrapper";

interface Props {
  onTurnOnDuty: () => void;
  onShareCard: () => void;
  onSkip: () => void;
}

export default function StepActionPrompt({ onTurnOnDuty, onShareCard, onSkip }: Props) {
  return (
    <OnboardingStepWrapper stepKey="action-prompt">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          Get Your First Lead
        </h2>
        <p className="text-sm text-muted-foreground">
          Take one of these actions to start receiving jobs
        </p>
      </div>

      <div className="space-y-2">
        <button
          onClick={onTurnOnDuty}
          className="w-full flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all text-left group"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Radio className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Turn On Duty</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Go on duty to receive estimate requests from customers in your area
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-3 shrink-0" />
        </button>

        <button
          onClick={onShareCard}
          className="w-full flex items-start gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 transition-all text-left group"
        >
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Share2 className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Share Your Card</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send your card to contacts, post on social media, or add to your email signature
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-3 shrink-0" />
        </button>

        <button
          onClick={onSkip}
          className="w-full flex items-start gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 transition-all text-left group"
        >
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <MessageSquare className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Explore the Dashboard</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse your tools — estimates, bookings, leads, and more
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-3 shrink-0" />
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        You can do all of these from your dashboard anytime
      </p>
    </OnboardingStepWrapper>
  );
}
