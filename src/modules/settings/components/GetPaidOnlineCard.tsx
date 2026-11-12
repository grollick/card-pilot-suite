import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useCard";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AskForMoreRoom from "@/components/beta/AskForMoreRoom";
import { normalizePaypalMe, normalizeStripeLink } from "@/lib/paymentLinks";

export const GET_PAID_ONLINE_ANCHOR = "get-paid-online";
const PAYPAL_ERROR = "That doesn't look like a PayPal.Me link. It should look like paypal.me/yourname.";
const STRIPE_ERROR = "That doesn't look like a Stripe payment link. It should start with https://buy.stripe.com/.";

export default function GetPaidOnlineCard() {
  const { data: profile } = useProfile();
  const { hasFeature } = usePlanLimits();
  const qc = useQueryClient();
  const { hash } = useLocation();
  const allowed = hasFeature("online_invoice_payments");
  const [paypal, setPaypal] = useState("");
  const [stripe, setStripe] = useState("");
  const [errors, setErrors] = useState<{ paypal?: string; stripe?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPaypal((profile as any)?.paypal_me_url ?? "");
    setStripe((profile as any)?.stripe_payment_link ?? "");
  }, [profile]);

  useEffect(() => {
    if (hash === `#${GET_PAID_ONLINE_ANCHOR}`) {
      setTimeout(() => document.getElementById(GET_PAID_ONLINE_ANCHOR)?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }, [hash]);

  const save = async (next: { paypal: string; stripe: string }) => {
    if (!profile) return;
    const pp = next.paypal.trim() ? normalizePaypalMe(next.paypal) : null;
    const st = next.stripe.trim() ? normalizeStripeLink(next.stripe) : null;
    const errs = {
      paypal: next.paypal.trim() && !pp ? PAYPAL_ERROR : undefined,
      stripe: next.stripe.trim() && !st ? STRIPE_ERROR : undefined,
    };
    setErrors(errs);
    if (errs.paypal || errs.stripe) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ paypal_me_url: pp, stripe_payment_link: st }).eq("id", profile.id);
    setSaving(false);
    if (error) { toast.error("Couldn't save your payment links. Please try again."); return; }
    setPaypal(pp ?? "");
    setStripe(st ?? "");
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Payment links saved");
  };

  return (
    <section id={GET_PAID_ONLINE_ANCHOR} className="rounded-xl border border-border bg-card p-6 space-y-4 scroll-mt-20">
      <div>
        <h2 className="text-lg font-semibold">Get paid online</h2>
        <p className="text-sm font-medium text-muted-foreground">Connect Stripe or PayPal</p>
      </div>
      {!allowed ? (
        <div className="space-y-3">
          <p className="text-sm flex items-center gap-2"><Lock className="h-4 w-4 text-muted-foreground" /> Online payment buttons are part of Pro.</p>
          <AskForMoreRoom limit="online_invoice_payments" className="min-h-11" />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Add your own payment link and your customers get a Pay button on every invoice. The money goes straight to you.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="paypal-me">PayPal.Me link</Label>
            <div className="flex gap-2">
              <Input id="paypal-me" className="min-h-11" placeholder="paypal.me/yourname" value={paypal}
                onChange={(e) => setPaypal(e.target.value)} aria-invalid={!!errors.paypal} />
              {paypal && (
                <Button variant="outline" className="min-h-11" disabled={saving} onClick={() => save({ paypal: "", stripe })}>Clear</Button>
              )}
            </div>
            {errors.paypal
              ? <p className="text-xs text-destructive">{errors.paypal}</p>
              : <p className="text-xs text-muted-foreground">Find it in the PayPal app under your profile.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stripe-link">Stripe payment link</Label>
            <div className="flex gap-2">
              <Input id="stripe-link" className="min-h-11" placeholder="https://buy.stripe.com/..." value={stripe}
                onChange={(e) => setStripe(e.target.value)} aria-invalid={!!errors.stripe} />
              {stripe && (
                <Button variant="outline" className="min-h-11" disabled={saving} onClick={() => save({ paypal, stripe: "" })}>Clear</Button>
              )}
            </div>
            {errors.stripe
              ? <p className="text-xs text-destructive">{errors.stripe}</p>
              : <p className="text-xs text-muted-foreground">In Stripe, create a Payment Link where the customer chooses what to pay, then paste it here.</p>}
          </div>
          <Button className="w-full sm:w-auto min-h-11" disabled={saving} onClick={() => save({ paypal, stripe })}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
          </Button>
        </>
      )}
    </section>
  );
}
