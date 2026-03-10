import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowUp, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getNextTier, getPlanByKey } from "@/lib/plans";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  currentPlan: string;
}

/**
 * Modal that prompts users to upgrade when they hit a plan limit.
 */
export default function UpgradePrompt({ open, onOpenChange, feature, currentPlan }: UpgradePromptProps) {
  const next = getNextTier(currentPlan);
  const currentDisplay = getPlanByKey(currentPlan)?.name ?? currentPlan;
  const nextName = next?.name ?? "a higher plan";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Upgrade to {nextName}</DialogTitle>
          <DialogDescription>
            You've reached the {feature} limit on your <span className="font-semibold">{currentDisplay}</span> plan.
            Upgrade to {nextName} to unlock more.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          <Link to="/app/settings">
            <Button className="w-full shadow-glow">
              <ArrowUp className="h-4 w-4 mr-1.5" /> View Plans & Upgrade
            </Button>
          </Link>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
