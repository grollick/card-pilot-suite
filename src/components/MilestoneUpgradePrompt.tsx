import { Button } from "@/components/ui/button";
import { TrendingUp, PartyPopper } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
    description: "Reply quickly while they're still deciding.",
    ctaText: "View lead",
    route: "/app/contacts",
  },
  first_booking: {
    icon: TrendingUp,
    title: "Your first booking just came in! 🎉",
    description: "Confirm it so your customer knows you're coming.",
    ctaText: "View booking",
    route: "/app/bookings",
  },
};

export default function MilestoneUpgradePrompt({ milestone, open, onOpenChange }: MilestoneUpgradePromptProps) {
  const content = milestoneContent[milestone];
  const Icon = content.icon;
  const navigate = useNavigate();

  return (
    <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md text-center"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">{content.title}</DialogTitle>
          <DialogDescription className="mt-2">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={() => { onOpenChange(false); navigate(content.route); }}>{content.ctaText}</Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
