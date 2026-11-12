import { useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const PAYMENT_METHOD_OPTIONS = [
  { value: "e_transfer", label: "E-transfer", phrase: "e-transfer" },
  { value: "cash", label: "Cash", phrase: "cash" },
  { value: "check", label: "Cheque", phrase: "cheque" },
  { value: "bank_transfer", label: "Bank transfer", phrase: "bank transfer" },
  { value: "paypal", label: "PayPal", phrase: "PayPal" },
  { value: "card", label: "Card", phrase: "card" },
  { value: "other", label: "Other", phrase: "another way" },
] as const;
export const methodName = (m?: string | null) => PAYMENT_METHOD_OPTIONS.find((o) => o.value === m)?.label ?? "Other";
export const methodPhrase = (m?: string | null) => PAYMENT_METHOD_OPTIONS.find((o) => o.value === m)?.phrase ?? "another way";

export interface InvoiceReport {
  customer_reported_at: string | null;
  customer_reported_method: string | null;
  customer_reported_reference: string | null;
  customer_reported_note: string | null;
}

interface Props {
  token: string;
  status: string;
  paidAt: string | null;
  businessName: string;
  report: InvoiceReport;
  onReported: (r: InvoiceReport) => void;
  payOnline?: { paypal_url: string | null; stripe_url: string | null } | null;
  amountDue?: number;
}

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Payment part of the customer invoice page. Online payment buttons will be added here later. */
export default function InvoicePaymentSection({ token, status, paidAt, businessName, report, onReported, payOnline, amountDue = 0 }: Props) {
  const [tapped, setTapped] = useState<null | "paypal" | "card">(null);
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState(report.customer_reported_method || "e_transfer");
  const [reference, setReference] = useState(report.customer_reported_reference || "");
  const [note, setNote] = useState(report.customer_reported_note || "");
  const [saving, setSaving] = useState(false);

  if (status === "cancelled") {
    return (
      <section className="bg-background rounded-xl border border-border p-5">
        <p className="text-sm">This invoice was cancelled. Call {businessName} if you have questions.</p>
      </section>
    );
  }

  if (status === "paid") {
    return (
      <section className="bg-primary/10 border border-primary/20 rounded-xl p-5 text-center">
        <p className="font-semibold text-primary">
          Paid in full{paidAt ? ` on ${format(new Date(paidAt), "MMMM d, yyyy")}` : ""}. Thank you.
        </p>
      </section>
    );
  }

  const submit = async (override?: "paypal" | "card") => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("invoice-share", {
      body: override
        ? { action: "report_payment", token, method: override, reference: null, note: null }
        : { action: "report_payment", token, method, reference: reference.trim() || null, note: note.trim() || null },
    });
    setSaving(false);
    let msg: string | null = data?.error ?? null;
    if (error) {
      const res = (error as any).context instanceof Response ? (error as any).context : null;
      msg = res ? (await res.json().catch(() => ({})))?.error : null;
      msg = msg || "Couldn't send that. Please try again.";
    }
    if (msg) { toast.error(msg); return; }
    onReported({
      customer_reported_at: data.customer_reported_at,
      customer_reported_method: data.customer_reported_method,
      customer_reported_reference: data.customer_reported_reference,
      customer_reported_note: data.customer_reported_note,
    });
    setOpen(false);
    setTapped(null);
  };

  if (!open && report.customer_reported_at) {
    return (
      <section className="bg-background rounded-xl border border-border p-5 space-y-2">
        <p className="text-sm">
          Thanks. We told {businessName} you sent payment by {methodPhrase(report.customer_reported_method)} on{" "}
          {format(new Date(report.customer_reported_at), "MMMM d")}. They will confirm once it arrives.
        </p>
        <button type="button" className="text-xs text-primary underline min-h-11" onClick={() => setOpen(true)}>
          Change what I sent
        </button>
      </section>
    );
  }

  const hasOnline = !!(payOnline?.paypal_url || payOnline?.stripe_url);
  return (
    <>
    {hasOnline && (
      <section className="bg-background rounded-xl border border-border p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Pay online</h2>
          <p className="text-sm text-muted-foreground">Amount due: {money(amountDue)}</p>
        </div>
        {payOnline?.paypal_url && (
          <div className="space-y-1.5">
            <Button asChild className="w-full min-h-12">
              <a href={payOnline.paypal_url} target="_blank" rel="noopener noreferrer" onClick={() => setTapped("paypal")}>Pay with PayPal</a>
            </Button>
            <p className="text-xs text-muted-foreground">You'll finish paying on PayPal's page.</p>
          </div>
        )}
        {payOnline?.stripe_url && (
          <div className="space-y-1.5">
            <Button asChild variant="outline" className="w-full min-h-12">
              <a href={payOnline.stripe_url} target="_blank" rel="noopener noreferrer" onClick={() => setTapped("card")}>Pay by card</a>
            </Button>
            <p className="text-xs text-muted-foreground">You'll finish paying on Stripe's page. Enter {money(amountDue)} when asked.</p>
          </div>
        )}
        {tapped && (
          <Button variant="secondary" className="w-full min-h-12" disabled={saving} onClick={() => submit(tapped)}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Finished paying? Tell {businessName}
          </Button>
        )}
      </section>
    )}
    <section className="bg-background rounded-xl border border-border p-5 space-y-4">
      <h2 className="text-base font-semibold">{hasOnline ? "Paid another way?" : "Paid already?"}</h2>
      {!open ? (
        <Button className="w-full min-h-12" onClick={() => setOpen(true)}>I've sent payment</Button>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="inv-method">How did you pay?</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="inv-method" className="min-h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="min-h-11">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-ref">Reference or confirmation number (optional)</Label>
            <Input id="inv-ref" className="min-h-11" maxLength={200} value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-note">Note (optional)</Label>
            <Textarea id="inv-note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button className="w-full min-h-12" onClick={() => submit()} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Tell {businessName} I've paid
          </Button>
          <Button variant="ghost" className="w-full min-h-11" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
        </div>
      )}
    </section>
    </>
  );
}
