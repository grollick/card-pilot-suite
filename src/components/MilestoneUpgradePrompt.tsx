import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, PartyPopper } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface MilestoneUpgradePromptProps {
  milestone: "first_lead" | "first_booking";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const milestoneContent = {
  first_lead: {
    icon: PartyPopper,
    title: "You got your first lead! 🎉",
    description: "Your guzzl.pro card is working. Imagine what happens when you add automated follow-ups — never let a lead go cold again.",
    ctaText: "Unlock Automated Follow-ups",
    stat: "Pro users convert 3x more leads with automation",
  },
  first_booking: {
    icon: TrendingUp,
    title: "Your first booking just came in! 🎉",
    description: "Customers are finding and booking you. Upgrade to fill your calendar faster with unlimited services, reminders, and marketing tools.",
    ctaText: "Get More Bookings on Pro",
    stat: "One new job covers your entire month of Pro",
  },
};

export default function MilestoneUpgradePrompt({ milestone, open, onOpenChange }: MilestoneUpgradePromptProps) {
  const content = milestoneContent[milestone];
  const Icon = content.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mb-2">
            <Icon className="h-7 w-7 text-success" />
          </div>
          <DialogTitle className="text-xl">{content.title}</DialogTitle>
          <DialogDescription className="mt-2">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        {/* ROI indicator */}
        <div className="flex items-center gap-2 rounded-lg bg-success/5 border border-success/20 px-4 py-2.5 mx-auto mt-2">
          <Sparkles className="h-4 w-4 text-success shrink-0" />
          <span className="text-xs font-medium text-success">{content.stat}</span>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Link to="/pricing">
            <Button className="w-full shadow-glow gap-2">
              {content.ctaText} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-[11px] text-muted-foreground">No credit card required · Cancel anytime</p>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
