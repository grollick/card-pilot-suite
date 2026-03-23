import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, Send, CheckCircle, Loader2, Plus, Trash2,
  Download, Copy, GripVertical, FileText, Link2, DollarSign, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useInvoice, useInvoiceLineItems, useUpdateInvoice, useUpdateInvoiceStatus,
  useSaveInvoiceLineItems, useCreateInvoice, type InvoiceStatus,
} from "@/hooks/useInvoices";
import { useInvoicePayments, useRecordPayment, useInvoicePaymentLink } from "@/hooks/useInvoicePayments";
import { useContacts } from "@/hooks/useContacts";
import { useJobs } from "@/hooks/useJobs";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { exportInvoicePDF } from "@/lib/invoicePdf";
import DocumentStatusBadge from "@/components/DocumentStatusBadge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

interface LineItem {
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const { data: invoice, isLoading: invoiceLoading } = useInvoice(isNew ? undefined : id);
  const { data: existingItems = [] } = useInvoiceLineItems(isNew ? undefined : id);
  const { data: contacts = [] } = useContacts();
  const { data: jobs = [] } = useJobs();

  const updateInvoice = useUpdateInvoice();
  const updateStatus = useUpdateInvoiceStatus();
  const saveLineItems = useSaveInvoiceLineItems();
  const createInvoice = useCreateInvoice();
  const { planKey, profile, hasFeature } = usePlanLimits();

  const [leadId, setLeadId] = useState("");
  const [jobId, setJobId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Payment due within 14 days of invoice date.");
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [items, setItems] = useState<LineItem[]>([
    { title: "", quantity: 1, unit_price: 0, line_total: 0 },
  ]);

  useEffect(() => {
    if (invoice) {
      setLeadId(invoice.lead_id || "");
      setJobId(invoice.job_id || "");
      setDueDate(invoice.due_date || "");
      setNotes(invoice.notes || "");
      setTerms(invoice.terms || "");
      setTaxPercent(Number(invoice.tax_total) || 0);
      setDiscountAmount(Number(invoice.discount_amount) || 0);
    }
  }, [invoice]);

  useEffect(() => {
    if (existingItems.length > 0) {
      setItems(
        existingItems.map((li: any) => ({
          title: li.title,
          description: li.description || "",
          quantity: Number(li.quantity),
          unit_price: Number(li.unit_price),
          line_total: Number(li.line_total),
        }))
      );
    }
  }, [existingItems]);

  const subtotal = useMemo(
    () => items.reduce((sum, li) => sum + li.line_total, 0),
    [items]
  );
  const taxTotal = useMemo(
    () => subtotal * (taxPercent / 100),
    [subtotal, taxPercent]
  );
  const grandTotal = useMemo(
    () => Math.max(0, subtotal + taxTotal - discountAmount),
    [subtotal, taxTotal, discountAmount]
  );

  const addItem = () =>
    setItems([...items, { title: "", quantity: 1, unit_price: 0, line_total: 0 }]);

  const duplicateItem = (idx: number) => {
    const copy = { ...items[idx] };
    const next = [...items];
    next.splice(idx + 1, 0, copy);
    setItems(next);
  };

  const removeItem = (idx: number) =>
    setItems(items.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    if (field === "quantity" || field === "unit_price") {
      updated[idx].line_total =
        Number(updated[idx].quantity) * Number(updated[idx].unit_price);
    }
    setItems(updated);
  };

  const handleSave = async () => {
    if (isNew) {
      await createInvoice.mutateAsync({
        lead_id: leadId || null,
        job_id: jobId || null,
        due_date: dueDate || undefined,
        subtotal,
        tax_total: taxTotal,
        discount_amount: discountAmount,
        grand_total: grandTotal,
        notes,
        terms,
        line_items: items.filter((li) => li.title),
      });
      navigate("/app/invoices");
    } else {
      await updateInvoice.mutateAsync({
        id: id!,
        lead_id: leadId || null,
        job_id: jobId || null,
        due_date: dueDate || null,
        subtotal,
        tax_total: taxTotal,
        discount_amount: discountAmount,
        grand_total: grandTotal,
        notes,
        terms,
      });
      await saveLineItems.mutateAsync({
        invoiceId: id!,
        items: items.filter((li) => li.title),
      });
    }
  };

  const handleExportPDF = () => {
    exportInvoicePDF({
      invoice: {
        ...(invoice ?? {}),
        leads: invoice?.leads ??
          contacts.find((c: any) => c.id === leadId),
        jobs: invoice?.jobs,
      },
      lineItems: items.filter((li) => li.title),
      profile: profile as any,
      planKey,
    });
  };

  const selectedContact = contacts.find((c: any) => c.id === leadId);

  if (!isNew && invoiceLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg"
            onClick={() => navigate("/app/invoices")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
             <h1 className="text-xl font-bold tracking-tight"><span className="font-black text-primary">guzzl</span> <span className="font-normal">{isNew ? "New Invoice" : invoice?.invoice_number}</span></h1>
            {!isNew && invoice && (
              <DocumentStatusBadge status={invoice.status} size="sm" />
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && invoice?.status === "draft" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                updateStatus.mutate({
                  id: id!,
                  status: "sent",
                  lead_id: invoice?.lead_id,
                  invoice_number: invoice?.invoice_number,
                })
              }
            >
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
          )}
          {!isNew &&
            ["sent", "viewed", "overdue"].includes(invoice?.status) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  updateStatus.mutate({
                    id: id!,
                    status: "paid",
                    lead_id: invoice?.lead_id,
                    invoice_number: invoice?.invoice_number,
                  })
                }
              >
                <CheckCircle className="h-3.5 w-3.5" /> Paid
              </Button>
            )}
          {(items.some((li) => li.title) || !isNew) && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleExportPDF}
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
          )}
          <Button
            size="sm"
            className="gap-1.5 shadow-glow"
            onClick={handleSave}
            disabled={createInvoice.isPending || updateInvoice.isPending}
          >
            {(createInvoice.isPending || updateInvoice.isPending) && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            <Save className="h-3.5 w-3.5" />
            {isNew ? "Create" : "Save"}
          </Button>
        </div>
      </motion.div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Editor (2/3) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-2 space-y-5"
        >
          {/* Client & Job */}
          <div className="dash-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Invoice Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Customer</Label>
                <Select value={leadId} onValueChange={setLeadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Job (optional)
                </Label>
                <Select
                  value={jobId || "none"}
                  onValueChange={(v) => setJobId(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Link to job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {jobs.map((j: any) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.job_number} — {j.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              {selectedContact && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {selectedContact.name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedContact.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedContact.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="dash-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Line Items
              </h2>
              <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>

            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-5">Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1" />
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group grid grid-cols-12 gap-2 items-center p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="col-span-12 sm:col-span-5 space-y-1">
                    <Input
                      placeholder="Service or item name"
                      value={item.title}
                      onChange={(e) => updateItem(idx, "title", e.target.value)}
                      className="h-8 text-sm font-medium border-0 bg-transparent px-0 focus-visible:ring-0"
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={item.description || ""}
                      onChange={(e) =>
                        updateItem(idx, "description", e.target.value)
                      }
                      className="h-6 text-xs text-muted-foreground border-0 bg-transparent px-0 focus-visible:ring-0"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(idx, "quantity", Number(e.target.value))
                      }
                      className="h-8 text-sm tabular-nums"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(idx, "unit_price", Number(e.target.value))
                        }
                        className="h-8 text-sm pl-6 tabular-nums"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-2 text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      ${item.line_total.toFixed(2)}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => duplicateItem(idx)}
                      title="Duplicate"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      title="Remove"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="dash-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Notes & Terms
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Notes for customer
                </Label>
                <Textarea
                  placeholder="Thank you for your business..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Terms & Conditions
                </Label>
                <Textarea
                  placeholder="Payment terms, warranty info..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Sticky Summary (1/3) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="lg:sticky lg:top-20 space-y-5">
            {/* Totals card */}
            <div className="dash-card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Summary</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums font-medium">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs text-muted-foreground shrink-0">
                    Tax %
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="h-8 w-20 text-sm tabular-nums text-right"
                  />
                </div>
                {taxTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="tabular-nums">+${taxTotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs text-muted-foreground shrink-0">
                    Discount $
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) =>
                      setDiscountAmount(Number(e.target.value))
                    }
                    className="h-8 w-20 text-sm tabular-nums text-right"
                  />
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Discount</span>
                    <span className="tabular-nums">
                      -${discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status & Payment card */}
            {!isNew && invoice && (
              <InvoicePaymentPanel
                invoice={invoice}
                invoiceId={id!}
                grandTotal={grandTotal}
              />
            )}

            {/* Quick actions */}
            <div className="dash-card p-5 space-y-2">
              <h2 className="text-sm font-semibold text-foreground">Actions</h2>
              {!isNew && invoice && (
                <CopyPayLinkButton invoiceId={id!} />
              )}
              {!isNew && invoice?.status === "draft" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() =>
                    updateStatus.mutate({
                      id: id!,
                      status: "sent",
                      lead_id: invoice?.lead_id,
                      invoice_number: invoice?.invoice_number,
                    })
                  }
                >
                  <Send className="h-3.5 w-3.5" /> Mark as Sent
                </Button>
              )}
              {!isNew &&
                ["sent", "viewed", "overdue"].includes(invoice?.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() =>
                      updateStatus.mutate({
                        id: id!,
                        status: "paid",
                        lead_id: invoice?.lead_id,
                        invoice_number: invoice?.invoice_number,
                      })
                    }
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Mark as Paid
                  </Button>
                )}
              {(items.some((li) => li.title) || !isNew) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleExportPDF}
                >
                  <Download className="h-3.5 w-3.5" /> Export PDF
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Payment Panel sub-component ── */
function InvoicePaymentPanel({ invoice, invoiceId, grandTotal }: { invoice: any; invoiceId: string; grandTotal: number }) {
  const { data: payments = [] } = useInvoicePayments(invoiceId);
  const recordPayment = useRecordPayment();
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [payRef, setPayRef] = useState("");

  const amountPaid = Number(invoice.amount_paid ?? 0);
  const remaining = Math.max(0, grandTotal - amountPaid);
  const isPaid = invoice.status === "paid";

  return (
    <div className="dash-card p-5 space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Payment</h2>
      <DocumentStatusBadge status={invoice.status} />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-medium tabular-nums">${grandTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Paid</span>
          <span className="font-medium tabular-nums text-success">${amountPaid.toFixed(2)}</span>
        </div>
        {!isPaid && remaining > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Balance</span>
            <span className="font-semibold tabular-nums text-destructive">${remaining.toFixed(2)}</span>
          </div>
        )}
      </div>

      {invoice.paid_at && (
        <p className="text-xs text-success">
          Paid {format(new Date(invoice.paid_at), "MMM d, yyyy")}
        </p>
      )}

      {/* Record payment form */}
      {!isPaid && !showRecordForm && (
        <Button
          size="sm"
          className="w-full gap-2"
          onClick={() => setShowRecordForm(true)}
        >
          <CreditCard className="h-3.5 w-3.5" /> Record Payment
        </Button>
      )}

      {showRecordForm && (
        <div className="space-y-3 pt-2 border-t border-border">
          <div>
            <Label className="text-xs text-muted-foreground">Method</Label>
            <Select value={payMethod} onValueChange={setPayMethod}>
              <SelectTrigger className="h-8">
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
            <Label className="text-xs text-muted-foreground">Reference #</Label>
            <Input
              placeholder="Optional"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowRecordForm(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1"
              disabled={recordPayment.isPending}
              onClick={() =>
                recordPayment.mutate({
                  invoiceId,
                  amount: remaining,
                  paymentMethod: payMethod,
                  paymentReference: payRef,
                  leadId: invoice.lead_id,
                  invoiceNumber: invoice.invoice_number,
                  grandTotal,
                }, { onSuccess: () => setShowRecordForm(false) })
              }
            >
              {recordPayment.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              ${remaining.toFixed(2)}
            </Button>
          </div>
        </div>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">History</p>
          {payments.map((p: any) => (
            <div key={p.id} className="flex justify-between text-xs">
              <span className="text-muted-foreground capitalize">{(p.payment_method || "").replace(/_/g, " ")}</span>
              <span className="tabular-nums font-medium">${Number(p.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Copy Pay Link button ── */
function CopyPayLinkButton({ invoiceId }: { invoiceId: string }) {
  const { data: payLink } = useInvoicePaymentLink(invoiceId);

  if (!payLink) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-start gap-2"
      onClick={() => {
        navigator.clipboard.writeText(payLink);
        toast.success("Payment link copied!");
      }}
    >
      <Link2 className="h-3.5 w-3.5" /> Copy Pay Link
    </Button>
  );
}
