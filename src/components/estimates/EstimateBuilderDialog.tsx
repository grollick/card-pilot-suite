import { useEffect, useState, useMemo } from "react";
import { Plus, Trash2, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useContacts } from "@/hooks/useContacts";
import {
  useEstimate, useCreateEstimate, useUpdateEstimate,
  generateEstimateNumber, calculateLineTotals, calculateEstimateTotals,
  type EstimateLineItem, type EstimateFormData
} from "@/hooks/useEstimates";
import { TRADES_TEMPLATES } from "@/lib/estimateTemplates";
import { exportEstimatePDF } from "@/lib/estimatePdf";
import { usePlanLimits } from "@/hooks/usePlanLimits";

const EMPTY_LINE_ITEM: EstimateLineItem = {
  title: "", description: "", quantity: 1, unit: "each",
  unit_price: 0, labor_hours: 0, labor_rate: 0,
  material_cost: 0, markup_percent: 0, tax_percent: 0,
  line_total: 0, sort_order: 0,
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editId?: string | null;
  defaultLeadId?: string;
  defaultBookingId?: string;
}

export default function EstimateBuilderDialog({ open, onOpenChange, editId, defaultLeadId, defaultBookingId }: Props) {
  const isEdit = !!editId;
  const { data: existing, isLoading: loadingExisting } = useEstimate(editId ?? undefined);
  const { data: contacts = [] } = useContacts();
  const createEstimate = useCreateEstimate();
  const updateEstimate = useUpdateEstimate();
  const { planKey, profile } = usePlanLimits();

  const [leadId, setLeadId] = useState<string>("");
  const [bookingId] = useState(defaultBookingId ?? "");
  const [estimateNumber, setEstimateNumber] = useState(generateEstimateNumber());
  const [status, setStatus] = useState<string>("draft");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [jobAddress, setJobAddress] = useState("");
  const [jobType, setJobType] = useState("");
  const [scope, setScope] = useState("");
  const [notes, setNotes] = useState("");
  const [templateKey, setTemplateKey] = useState("");
  const [lineItems, setLineItems] = useState<EstimateLineItem[]>([{ ...EMPTY_LINE_ITEM }]);

  // Populate from existing on edit
  useEffect(() => {
    if (isEdit && existing) {
      setLeadId(existing.lead_id ?? "");
      setEstimateNumber(existing.estimate_number);
      setStatus(existing.status);
      setIssueDate(existing.issue_date);
      setExpiryDate(existing.expiry_date ?? "");
      setJobAddress(existing.job_address ?? "");
      setJobType(existing.job_type ?? "");
      setScope(existing.scope_of_work ?? "");
      setNotes(existing.notes ?? "");
      setTemplateKey(existing.template_key ?? "");
      if (existing.estimate_line_items?.length) {
        setLineItems(
          [...existing.estimate_line_items].sort((a: any, b: any) => a.sort_order - b.sort_order)
        );
      } else {
        setLineItems([{ ...EMPTY_LINE_ITEM }]);
      }
    } else if (!isEdit && open) {
      resetForm();
    }
  }, [isEdit, existing, open]);

  function resetForm() {
    setLeadId(defaultLeadId ?? "");
    setEstimateNumber(generateEstimateNumber());
    setStatus("draft");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setExpiryDate("");
    setJobAddress("");
    setJobType("");
    setScope("");
    setNotes("");
    setTemplateKey("");
    setLineItems([{ ...EMPTY_LINE_ITEM }]);
  }

  const handleTemplateChange = (key: string) => {
    setTemplateKey(key);
    const tpl = TRADES_TEMPLATES.find(t => t.key === key);
    if (tpl) {
      setJobType(tpl.defaultJobType);
      setLineItems(tpl.lineItems.map((li, i) => calculateLineTotals({ ...li, sort_order: i })));
    }
  };

  const updateLineItem = (idx: number, field: string, value: any) => {
    setLineItems(prev => {
      const updated = [...prev];
      const item = { ...updated[idx], [field]: value };
      updated[idx] = calculateLineTotals(item);
      return updated;
    });
  };

  const addLineItem = () => setLineItems(prev => [...prev, { ...EMPTY_LINE_ITEM, sort_order: prev.length }]);
  const removeLineItem = (idx: number) => setLineItems(prev => prev.filter((_, i) => i !== idx));

  const totals = useMemo(() => calculateEstimateTotals(lineItems), [lineItems]);

  const handleSave = async () => {
    const form: EstimateFormData = {
      lead_id: leadId || null,
      booking_id: bookingId || null,
      estimate_number: estimateNumber,
      status: (isEdit ? status : "draft") as any,
      issue_date: issueDate,
      expiry_date: expiryDate || null,
      job_address: jobAddress,
      job_type: jobType,
      scope_of_work: scope,
      notes,
      template_key: templateKey,
      line_items: lineItems,
    };
    if (isEdit && editId) {
      await updateEstimate.mutateAsync({ ...form, id: editId });
    } else {
      await createEstimate.mutateAsync(form);
    }
    onOpenChange(false);
  };

  const handleExportPDF = () => {
    const selectedContact = contacts.find((c: any) => c.id === leadId);
    exportEstimatePDF({
      estimate: {
        estimate_number: estimateNumber,
        issue_date: issueDate,
        expiry_date: expiryDate || null,
        job_address: jobAddress,
        job_type: jobType,
        scope_of_work: scope,
        notes,
        status,
        leads: selectedContact ? { name: selectedContact.name, email: selectedContact.email, phone: selectedContact.phone, company: selectedContact.company } : existing?.leads,
      },
      lineItems,
      totals,
      profile: profile as any,
      planKey,
    });
  };

  const saving = createEstimate.isPending || updateEstimate.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{isEdit ? `Edit ${estimateNumber}` : "New Estimate"}</DialogTitle>
            {(isEdit || lineItems.some(li => li.title)) && (
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> PDF
              </Button>
            )}
          </div>
        </DialogHeader>

        {isEdit && loadingExisting ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-6">
            {/* Template selector (new only) */}
            {!isEdit && (
              <div>
                <Label>Trades Template</Label>
                <Select value={templateKey} onValueChange={handleTemplateChange}>
                  <SelectTrigger><SelectValue placeholder="Start from template…" /></SelectTrigger>
                  <SelectContent>
                    {TRADES_TEMPLATES.map(t => (
                      <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Customer + Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Contact</Label>
                <Select value={leadId} onValueChange={setLeadId}>
                  <SelectTrigger><SelectValue placeholder="Select contact…" /></SelectTrigger>
                  <SelectContent>
                    {contacts.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estimate #</Label>
                <Input value={estimateNumber} onChange={e => setEstimateNumber(e.target.value)} />
              </div>
              <div>
                <Label>Issue Date</Label>
                <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
              </div>
              <div>
                <Label>Job Type</Label>
                <Input value={jobType} onChange={e => setJobType(e.target.value)} placeholder="e.g. Bathroom Remodel" />
              </div>
              <div>
                <Label>Job Address</Label>
                <Input value={jobAddress} onChange={e => setJobAddress(e.target.value)} placeholder="123 Main St" />
              </div>
            </div>

            <div>
              <Label>Scope of Work</Label>
              <Textarea value={scope} onChange={e => setScope(e.target.value)} rows={3} placeholder="Describe the work to be done…" />
            </div>

            <Separator />

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Line Items</Label>
                <Button variant="outline" size="sm" onClick={addLineItem}><Plus className="h-3.5 w-3.5 mr-1" /> Add Item</Button>
              </div>
              <div className="space-y-3">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-3 space-y-3 bg-muted/20">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <Input placeholder="Item title" value={item.title} onChange={e => updateLineItem(idx, "title", e.target.value)} />
                        </div>
                        <Input placeholder="Description" value={item.description ?? ""} onChange={e => updateLineItem(idx, "description", e.target.value)} />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeLineItem(idx)} disabled={lineItems.length === 1}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Qty</Label>
                        <Input type="number" value={item.quantity} onChange={e => updateLineItem(idx, "quantity", +e.target.value)} min={0} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Unit</Label>
                        <Input value={item.unit} onChange={e => updateLineItem(idx, "unit", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Unit Price</Label>
                        <Input type="number" value={item.unit_price} onChange={e => updateLineItem(idx, "unit_price", +e.target.value)} min={0} step={0.01} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Line Total</Label>
                        <Input value={`$${item.line_total.toFixed(2)}`} readOnly className="bg-muted/30 tabular-nums" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Labor Hrs</Label>
                        <Input type="number" value={item.labor_hours} onChange={e => updateLineItem(idx, "labor_hours", +e.target.value)} min={0} step={0.5} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Labor Rate</Label>
                        <Input type="number" value={item.labor_rate} onChange={e => updateLineItem(idx, "labor_rate", +e.target.value)} min={0} step={0.01} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Material $</Label>
                        <Input type="number" value={item.material_cost} onChange={e => updateLineItem(idx, "material_cost", +e.target.value)} min={0} step={0.01} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Markup %</Label>
                        <Input type="number" value={item.markup_percent} onChange={e => updateLineItem(idx, "markup_percent", +e.target.value)} min={0} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Tax %</Label>
                        <Input type="number" value={item.tax_percent} onChange={e => updateLineItem(idx, "tax_percent", +e.target.value)} min={0} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">${totals.subtotal.toFixed(2)}</span></div>
              {totals.labor_total > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Labor</span><span className="tabular-nums">${totals.labor_total.toFixed(2)}</span></div>}
              {totals.material_total > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Materials</span><span className="tabular-nums">${totals.material_total.toFixed(2)}</span></div>}
              {totals.markup_total > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Markup</span><span className="tabular-nums">${totals.markup_total.toFixed(2)}</span></div>}
              {totals.tax_total > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax</span><span className="tabular-nums">${totals.tax_total.toFixed(2)}</span></div>}
              <Separator />
              <div className="flex justify-between text-base font-bold"><span>Grand Total</span><span className="tabular-nums">${totals.grand_total.toFixed(2)}</span></div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Payment terms, warranty info…" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !estimateNumber}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? "Update Estimate" : "Create Estimate"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
