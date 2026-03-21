import { MarketplaceApp } from "@/hooks/useMarketplaceApps";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  app: MarketplaceApp | null;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

export default function PurchaseAppDialog({ app, onClose, onPurchaseComplete }: Props) {
  const [processing, setProcessing] = useState(false);

  if (!app) return null;

  const priceLabel =
    app.pricing_type === "subscription"
      ? `$${app.price_amount}/mo`
      : `$${app.price_amount}`;

  const handlePurchase = async () => {
    setProcessing(true);
    try {
      // Stripe checkout will be wired here once Stripe is enabled
      toast.info("Payment processing will be available soon. The app has been added to your wishlist.", {
        duration: 5000,
      });
      onPurchaseComplete();
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={!!app} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-primary" />
            Purchase App
          </DialogTitle>
          <DialogDescription className="text-xs">
            Complete your purchase to install this app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* App summary */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0 overflow-hidden">
              {app.icon_url ? (
                <img src={app.icon_url} alt={app.name} className="h-8 w-8 rounded-lg object-contain" />
              ) : "📦"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{app.name}</p>
              <p className="text-2xs text-muted-foreground">{app.developer_name}</p>
            </div>
            <Badge className="text-xs font-bold bg-primary/10 text-primary border-primary/20">
              {priceLabel}
            </Badge>
          </div>

          {/* Purchase details */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-dashed">
              <span className="text-muted-foreground">App price</span>
              <span className="font-medium">{priceLabel}</span>
            </div>
            {app.pricing_type === "subscription" && (
              <div className="flex justify-between py-1.5 border-b border-dashed">
                <span className="text-muted-foreground">Billing</span>
                <span className="font-medium">Monthly, cancel anytime</span>
              </div>
            )}
          </div>

          {/* Info notice */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-2xs text-amber-700 dark:text-amber-400">
              Payment processing is being set up. You can add this to your wishlist for now and we'll notify you when checkout is live.
            </p>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-1.5 text-2xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            Payments secured by Stripe. We never store your card details.
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 text-xs h-9" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1 text-xs h-9 gap-1.5" onClick={handlePurchase} disabled={processing}>
              {processing ? "Processing…" : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Add to Wishlist
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
