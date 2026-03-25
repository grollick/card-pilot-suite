import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import PublicTopBar from "@/modules/public/components/PublicTopBar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2, CreditCard, FileText, Loader2, DollarSign, Calendar,
  Building2, User, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import DocumentStatusBadge from "@/components/DocumentStatusBadge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

export default function PublicInvoicePage() {
  const { token } = useParams();
  const qc = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [showPayForm, setShowPayForm] = useState(false);

  // Fetch invoice by payment_token
  const { data: invoice, isLoading } = useQuery({
    queryKey: ["public-invoice", token],
    enabled: !!token,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, leads(name, email, phone, company)")
        .eq("payment_token", token!)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  // Fetch line items
  const { data: lineItems = [] } = useQuery({
    queryKey: ["public-invoice-items", invoice?.id],
    enabled: !!invoice?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", invoice.id)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // Fetch existing payments
  const { data: payments = [] } = useQuery({
    queryKey: ["public-invoice-payments", invoice?.id],
    enabled: !!invoice?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_payments")
        .select("*")
        .eq("invoice_id", invoice.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const grandTotal = Number(invoice?.grand_total ?? 0);
  const amountPaid = Number(invoice?.amount_paid ?? 0);
  const remainingBalance = Math.max(0, grandTotal - amountPaid);
  const isPaid = invoice?.status === "paid";

  // Record payment mutation via secure edge function
  const recordPayment = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("record-invoice-payment", {
        body: {
          payment_token: token,
          payment_method: paymentMethod,
          payment_reference: paymentRef || null,
          notes: paymentNotes || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["public-invoice", token] });
      qc.invalidateQueries({ queryKey: ["public-invoice-payments", invoice?.id] });
      setShowPayForm(false);
      toast.success("Payment recorded! Thank you.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <h1 className="text-xl font-bold">Invoice Not Found</h1>
          <p className="text-sm text-muted-foreground">This link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  // Fetch profile for branding
  const customerName = invoice.leads?.name || "Customer";

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header bar */}
      <div className="bg-background border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{invoice.invoice_number}</h1>
              <p className="text-xs text-muted-foreground">Invoice</p>
            </div>
          </div>
          <DocumentStatusBadge status={invoice.status} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Payment confirmation banner */}
        {isPaid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-success/10 border border-success/20 rounded-xl p-6 text-center"
          >
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
            <h2 className="text-xl font-bold text-success">Payment Complete</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Thank you for your payment of ${grandTotal.toLocaleString()}
            </p>
            {invoice.paid_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Paid on {format(new Date(invoice.paid_at), "MMMM d, yyyy")}
              </p>
            )}
          </motion.div>
        )}

        {/* Invoice details */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background rounded-xl border border-border p-6 space-y-5"
        >
          {/* Bill To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Bill To</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{customerName}</span>
              </div>
              {invoice.leads?.email && (
                <p className="text-sm text-muted-foreground">{invoice.leads.email}</p>
              )}
              {invoice.leads?.company && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  {invoice.leads.company}
                </div>
              )}
            </div>
            <div className="space-y-1 sm:text-right">
              {invoice.due_date && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Due Date</p>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(new Date(invoice.due_date + "T00:00:00"), "MMMM d, yyyy")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Line items */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Items</p>
            <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            {lineItems.map((item: any) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 py-2 border-b border-border/40 last:border-0">
                <div className="col-span-12 sm:col-span-6">
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
                <div className="col-span-4 sm:col-span-2 text-right text-sm tabular-nums">{item.quantity}</div>
                <div className="col-span-4 sm:col-span-2 text-right text-sm tabular-nums">${Number(item.unit_price).toFixed(2)}</div>
                <div className="col-span-4 sm:col-span-2 text-right text-sm font-semibold tabular-nums">${Number(item.line_total).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">${Number(invoice.subtotal ?? 0).toFixed(2)}</span>
            </div>
            {Number(invoice.tax_total) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">+${Number(invoice.tax_total).toFixed(2)}</span>
              </div>
            )}
            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Discount</span>
                <span className="tabular-nums">-${Number(invoice.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-baseline">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold tabular-nums">${grandTotal.toLocaleString()}</span>
            </div>
            {amountPaid > 0 && !isPaid && (
              <>
                <div className="flex justify-between text-sm text-success">
                  <span>Paid</span>
                  <span className="tabular-nums">-${amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Balance Due</span>
                  <span className="tabular-nums text-destructive">${remainingBalance.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          {invoice.notes && (
            <>
              <Separator />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            </>
          )}
          {invoice.terms && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Terms</p>
              <p className="text-sm text-muted-foreground">{invoice.terms}</p>
            </div>
          )}
        </motion.div>

        {/* Pay Now section */}
        {!isPaid && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-background rounded-xl border border-border p-6 space-y-4"
          >
            {!showPayForm ? (
              <div className="text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <CreditCard className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Ready to pay?</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Amount due: <span className="font-semibold text-foreground">${remainingBalance.toLocaleString()}</span>
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full sm:w-auto px-12 shadow-glow"
                  onClick={() => setShowPayForm(true)}
                >
                  <DollarSign className="h-4 w-4 mr-2" /> Pay Now
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold">Complete Payment</h2>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="e_transfer">E-Transfer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Reference / Confirmation #</Label>
                  <Input
                    placeholder="e.g. Transfer ID, check number..."
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
                  <Textarea
                    placeholder="Any additional notes..."
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-xl font-bold tabular-nums">${remainingBalance.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowPayForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 shadow-glow"
                    onClick={() => recordPayment.mutate()}
                    disabled={recordPayment.isPending}
                  >
                    {recordPayment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm Payment
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Payment history */}
        {payments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-background rounded-xl border border-border p-6 space-y-3"
          >
            <h2 className="text-sm font-semibold">Payment History</h2>
            {payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div>
                  <p className="text-sm font-medium capitalize">{(p.payment_method || "").replace(/_/g, " ")}</p>
                  {p.payment_reference && (
                    <p className="text-xs text-muted-foreground">Ref: {p.payment_reference}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(p.paid_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <span className="font-semibold tabular-nums text-success">${Number(p.amount).toLocaleString()}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center py-6 space-y-1.5">
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70">
            <span className="inline-block h-3 w-3">🔒</span>
            Secure and encrypted transactions
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by guzzl.pro
          </p>
        </div>
      </div>
    </div>
  );
}
