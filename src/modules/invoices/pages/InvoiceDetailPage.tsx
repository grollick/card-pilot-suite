import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Send, CheckCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  useInvoice, useInvoiceLineItems, useUpdateInvoice, useUpdateInvoiceStatus,
  useSaveInvoiceLineItems, useCreateInvoice,
  INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS, type InvoiceStatus,
} from "@/hooks/useInvoices";
import { useContacts } from "@/hooks/useContacts";
import { useJobs } from "@/hooks/useJobs";
import { format } from "date-fns";

interface LineItem {
  title: string; description?: string; quantity: number; unit_price: number; line_total: number;
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

  const [leadId, setLeadId] = useState<string>("");
  const [jobId, setJobId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Payment due within 14 days of invoice date.");
  const [items, setItems] = useState<LineItem[]>([{ title: "", quantity: 1, unit_price: 0, line_total: 0 }]);

  useEffect(() => {
    if (invoice) {
      setLeadId(invoice.lead_id || "");
      setJobId(invoice.job_id || "");
      setDueDate(invoice.due_date || "");
      setNotes(invoice.notes || "");
      setTerms(invoice.terms || "");
    }
  }, [invoice]);

  useEffect(() => {
    if (existingItems.length > 0) {
      setItems(existingItems.map((li: any) => ({
        title: li.title, description: li.description || "",
        quantity: Number(li.quantity), unit_price: Number(li.unit_price), line_total: Number(li.line_total),
      })));
    }
  }, [existingItems]);

  const subtotal = items.reduce((sum, li) => sum + li.line_total, 0);
  const grandTotal = subtotal;

  const addItem = () => setItems([...items, { title: "", quantity: 1, unit_price: 0, line_total: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    if (field === "quantity" || field === "unit_price") {
      updated[idx].line_total = Number(updated[idx].quantity) * Number(updated[idx].unit_price);
    }
    setItems(updated);
  };

  const handleSave = async () => {
    if (isNew) {
      await createInvoice.mutateAsync({
        lead_id: leadId || null,
        job_id: jobId || null,
        due_date: dueDate || undefined,
        subtotal, grand_total: grandTotal,
        notes, terms,
        line_items: items.filter((li) => li.title),
      });
      navigate("/app/invoices");
    } else {
      await updateInvoice.mutateAsync({
        id: id!,
        lead_id: leadId || null,
        job_id: jobId || null,
        due_date: dueDate || null,
        subtotal, grand_total: grandTotal,
        notes, terms,
      });
      await saveLineItems.mutateAsync({
        invoiceId: id!,
        items: items.filter((li) => li.title),
      });
    }
  };

  if (!isNew && invoiceLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/invoices")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {isNew ? "New Invoice" : `Invoice ${invoice?.invoice_number}`}
            </h1>
            {!isNew && invoice && (
              <Badge className={`text-[10px] mt-1 ${INVOICE_STATUS_COLORS[invoice.status as InvoiceStatus]}`}>
                {INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus]}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && invoice?.status === "draft" && (
            <Button variant="outline" onClick={() => updateStatus.mutate({ id: id!, status: "sent" })}>
              <Send className="h-4 w-4 mr-2" /> Mark Sent
            </Button>
          )}
          {!isNew && ["sent", "viewed", "overdue"].includes(invoice?.status) && (
            <Button variant="outline" onClick={() => updateStatus.mutate({ id: id!, status: "paid" })}>
              <CheckCircle className="h-4 w-4 mr-2" /> Mark Paid
            </Button>
          )}
          <Button onClick={handleSave} disabled={createInvoice.isPending || updateInvoice.isPending}>
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </div>
      </div>

      {/* Customer & Job */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Invoice Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Customer</Label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {contacts.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Job (optional)</Label>
              <Select value={jobId || "none"} onValueChange={(v) => setJobId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Link to job" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {jobs.map((j: any) => (
                    <SelectItem key={j.id} value={j.id}>{j.job_number} — {j.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">Line Items</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-3 w-3 mr-1" /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                {idx === 0 && <Label className="text-xs">Description</Label>}
                <Input
                  placeholder="Service description"
                  value={item.title}
                  onChange={(e) => updateItem(idx, "title", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                {idx === 0 && <Label className="text-xs">Qty</Label>}
                <Input
                  type="number" min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                />
              </div>
              <div className="col-span-2">
                {idx === 0 && <Label className="text-xs">Price</Label>}
                <Input
                  type="number" min={0} step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateItem(idx, "unit_price", Number(e.target.value))}
                />
              </div>
              <div className="col-span-2 text-right">
                {idx === 0 && <Label className="text-xs">Total</Label>}
                <p className="h-9 flex items-center justify-end font-medium text-sm">
                  ${item.line_total.toFixed(2)}
                </p>
              </div>
              <div className="col-span-1">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          <Separator />
          <div className="flex justify-end">
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Subtotal: <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span></p>
              <p className="text-lg font-bold">Total: ${grandTotal.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label>Notes</Label>
            <Textarea placeholder="Notes for the customer..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Terms & Conditions</Label>
            <Textarea placeholder="Payment terms..." value={terms} onChange={(e) => setTerms(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
