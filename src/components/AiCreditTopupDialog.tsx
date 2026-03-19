import { useState } from "react";
import { Sparkles, Zap, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAiCredits, type AiCreditPack } from "@/hooks/useAiCredits";
import { toast } from "sonner";

interface AiCreditTopupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AiCreditTopupDialog({ open, onOpenChange }: AiCreditTopupDialogProps) {
  const { used, planLimit, bonus, packs, purchasePack, planKey } = useAiCredits();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (pack: AiCreditPack) => {
    setPurchasing(pack.id);
    try {
      const result = await purchasePack(pack.id);
      if (result.code === "STRIPE_NOT_CONFIGURED") {
        toast.error("Payment processing is being set up. Check back soon!");
      } else if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${pack.credits} AI credits added!`);
        onOpenChange(false);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl text-center">Buy More AI Credits</DialogTitle>
          <DialogDescription className="text-center">
            You've used {used} of {planLimit === -1 ? "∞" : planLimit} monthly requests
            {bonus > 0 && ` (+${bonus} bonus credits)`}.
            Purchase a top-up pack to keep using AI features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {packs.map((pack) => (
            <button
              key={pack.id}
              onClick={() => handlePurchase(pack)}
              disabled={purchasing !== null}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 active:scale-[0.98] transition-all text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{pack.credits} AI Credits</p>
                  <p className="text-xs text-muted-foreground">Never expires</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  ${(pack.price_cents / 100).toFixed(2)}
                </span>
                {purchasing === pack.id && (
                  <CreditCard className="h-4 w-4 animate-pulse text-primary" />
                )}
              </div>
            </button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-2">
          Credits are added instantly and don't expire for 1 year.
        </p>

        <Button variant="ghost" className="w-full mt-1" onClick={() => onOpenChange(false)}>
          Maybe later
        </Button>
      </DialogContent>
    </Dialog>
  );
}
