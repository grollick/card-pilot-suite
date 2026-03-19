import { useEffect, useState, useMemo, useCallback } from "react";
import DesktopGuidanceNotice from "@/components/DesktopGuidanceNotice";
import { Plus, Trash2, Loader2, Download, ChevronDown, ChevronRight, Calculator, Bookmark, Sparkles } from "lucide-react";
import EstimateAssistantSheet from "./EstimateAssistantSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { useContacts } from "@/hooks/useContacts";
import {
  useEstimate, useCreateEstimate, useUpdateEstimate,
  generateEstimateNumber, calculateLineTotals, calculateEstimateTotals,
  type EstimateLineItem, type EstimateFormData, type EstimateSection,
} from "@/hooks/useEstimates";
import { TRADES_TEMPLATES } from "@/lib/estimateTemplates";
import { exportEstimatePDF } from "@/lib/estimatePdf";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useEstimatePresets, DEFAULT_PRESETS, type PresetType } from "@/hooks/useEstimatePresets";
import { CALC_MODES, calcQuantityFromMode, dimensionFieldsForMode, unitForMode, type CalcMode } from "@/lib/estimateCalculators";

const EMPTY_LINE_ITEM: EstimateLineItem = {
  title: "", description: "", quantity: 1, unit: "each",
  unit_price: 0, labor_hours: 0, labor_rate: 0,
  material_cost: 0, markup_percent: 0, tax_percent: 0,
  line_total: 0, sort_order: 0,
  calc_mode: "unit_count", calc_length: 0, calc_width: 0, calc_depth: 0,
  is_optional: false,
};

function makeSection(name = "General", items: EstimateLineItem[] = [{ ...EMPTY_LINE_ITEM }]): EstimateSection {
  return { _tempId: crypto.randomUUID(), name, notes: "", sort_order: 0, items };
}

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
  const { data: presets = [] } = useEstimatePresets();

  const allPresets = presets.length > 0 ? presets : DEFAULT_PRESETS as any[];

  const [leadId, setLeadId] = useState("");
  const [bookingId] = useState(defaultBookingId ?? "");
  const [estimateNumber, setEstimateNumber] = useState(generateEstimateNumber());
  const [status, setStatus] = useState("draft");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [jobAddress, setJobAddress] = useState("");
  const [jobType, setJobType] = useState("");
  const [scope, setScope] = useState("");
  const [notes, setNotes] = useState("");
  const [templateKey, setTemplateKey] = useState("");
  const [sections, setSections] = useState<EstimateSection[]>([makeSection()]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositPercent, setDepositPercent] = useState(0);
  const [termsConditions, setTermsConditions] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [showFinancials, setShowFinancials] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  useEffect(() => {
    if (isEdit && existing) {
      setLeadId(existing.lead_id ?? "");
      setEstimateNumber(existing.estimate_number);
      setStatus(existing.status);
      setIssueDate(existing.issue_date);
      setExpiryDate((existing as any).expiry_date ?? "");
      setJobAddress((existing as any).job_address ?? "");
      setJobType((existing as any).job_type ?? "");
      setScope((existing as any).scope_of_work ?? "");
      setNotes((existing as any).notes ?? "");
      setTemplateKey((existing as any).template_key ?? "");
      setDiscountAmount(Number((existing as any).discount_amount) || 0);
      setDiscountPercent(Number((existing as any).discount_percent) || 0);
      setDepositAmount(Number((existing as any).deposit_amount) || 0);
      setDepositPercent(Number((existing as any).deposit_percent) || 0);
      setTermsConditions((existing as any).terms_conditions ?? "");
      setInternalNotes((existing as any).internal_notes ?? "");

      const dbSections = (existing as any).estimate_sections ?? [];
      const lineItems = [...(existing.estimate_line_items ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order);

      if (dbSections.length > 0) {
        const mapped = dbSections.sort((a: any, b: any) => a.sort_order - b.sort_order).map((s: any, i: number) => ({
          _tempId: crypto.randomUUID(),
          id: s.id, name: s.name, notes: s.notes ?? "", sort_order: i,
          items: lineItems.filter((li: any) => li.section_id === s.id).map((li: any) => ({ ...li, calc_mode: li.calc_mode as CalcMode })),
        }));
        const unsectioned = lineItems.filter((li: any) => !li.section_id);
        if (unsectioned.length > 0) mapped.push(makeSection("General", unsectioned.map((li: any) => ({ ...li, calc_mode: li.calc_mode as CalcMode }))));
        setSections(mapped.length > 0 ? mapped : [makeSection()]);
      } else {
        setSections([makeSection("General", lineItems.length > 0 ? lineItems.map((li: any) => ({ ...li, calc_mode: (li.calc_mode || "unit_count") as CalcMode })) : [{ ...EMPTY_LINE_ITEM }])]);
      }

      if (Number((existing as any).discount_amount) > 0 || Number((existing as any).discount_percent) > 0 || Number((existing as any).deposit_amount) > 0 || Number((existing as any).deposit_percent) > 0) setShowFinancials(true);
    } else if (!isEdit && open) {
      resetForm();
    }
  }, [isEdit, existing, open]);

  function resetForm() {
    setLeadId(defaultLeadId ?? "");
    setEstimateNumber(generateEstimateNumber());
    setStatus("draft");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setExpiryDate(""); setJobAddress(""); setJobType(""); setScope(""); setNotes("");
    setTemplateKey(""); setSections([makeSection()]);
    setDiscountAmount(0); setDiscountPercent(0); setDepositAmount(0); setDepositPercent(0);
    setTermsConditions(""); setInternalNotes(""); setShowFinancials(false);
  }

  const handleTemplateChange = (key: string) => {
    setTemplateKey(key);
    const tpl = TRADES_TEMPLATES.find(t => t.key === key);
    if (tpl) {
      setJobType(tpl.defaultJobType);
      setSections(tpl.sections.map((sec, si) => ({
        _tempId: crypto.randomUUID(), name: sec.name, notes: "", sort_order: si,
        items: sec.items.map((li, i) => calculateLineTotals({ ...li, sort_order: i } as any)),
      })));
    }
  };

  const updateLineItem = useCallback((sectionIdx: number, itemIdx: number, field: string, value: any) => {
    setSections(prev => prev.map((s, si) => {
      if (si !== sectionIdx) return s;
      const items = s.items.map((item, ii) => {
        if (ii !== itemIdx) return item;
        let newItem = { ...item, [field]: value };
        if (["calc_mode", "calc_length", "calc_width", "calc_depth", "labor_hours", "quantity"].includes(field)) {
          const mode = field === "calc_mode" ? value : newItem.calc_mode;
          if (mode !== "unit_count") newItem.quantity = calcQuantityFromMode(mode, newItem);
          if (field === "calc_mode") { const autoUnit = unitForMode(value); if (autoUnit) newItem.unit = autoUnit; }
        }
        return calculateLineTotals(newItem);
      });
      return { ...s, items };
    }));
  }, []);

  const addLineItem = (si: number) => setSections(prev => prev.map((s, i) => i === si ? { ...s, items: [...s.items, { ...EMPTY_LINE_ITEM, sort_order: s.items.length }] } : s));
  const removeLineItem = (si: number, ii: number) => setSections(prev => prev.map((s, i) => i === si ? { ...s, items: s.items.filter((_, j) => j !== ii) } : s));
  const addSection = () => setSections(prev => [...prev, makeSection(`Section ${prev.length + 1}`)]);
  const removeSection = (idx: number) => setSections(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== idx));
  const updateSectionField = (idx: number, field: string, value: string) => setSections(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  const totals = useMemo(() => calculateEstimateTotals(sections, { discount_amount: discountAmount, discount_percent: discountPercent, deposit_amount: depositAmount, deposit_percent: depositPercent }), [sections, discountAmount, discountPercent, depositAmount, depositPercent]);

  const handleSave = async () => {
    const form: EstimateFormData = {
      lead_id: leadId || null, booking_id: bookingId || null,
      estimate_number: estimateNumber, status: (isEdit ? status : "draft") as any,
      issue_date: issueDate, expiry_date: expiryDate || null,
      job_address: jobAddress, job_type: jobType, scope_of_work: scope, notes,
      template_key: templateKey, discount_amount: discountAmount, discount_percent: discountPercent,
      deposit_amount: depositAmount, deposit_percent: depositPercent,
      terms_conditions: termsConditions || undefined, internal_notes: internalNotes || undefined,
      sections,
    };
    if (isEdit && editId) await updateEstimate.mutateAsync({ ...form, id: editId });
    else await createEstimate.mutateAsync(form);
    onOpenChange(false);
  };

  const handleExportPDF = () => {
    const selectedContact = contacts.find((c: any) => c.id === leadId);
    exportEstimatePDF({
      estimate: { estimate_number: estimateNumber, issue_date: issueDate, expiry_date: expiryDate || null, job_address: jobAddress, job_type: jobType, scope_of_work: scope, notes, status, terms_conditions: termsConditions, discount_amount: discountAmount, discount_percent: discountPercent, deposit_amount: depositAmount, deposit_percent: depositPercent, leads: selectedContact ? { name: selectedContact.name, email: selectedContact.email, phone: selectedContact.phone, company: selectedContact.company } : existing?.leads },
      sections, totals, profile: profile as any, planKey,
    });
  };

  const saving = createEstimate.isPending || updateEstimate.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle>{isEdit ? `Edit ${estimateNumber}` : "New Estimate"}</DialogTitle>
             <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setAssistantOpen(true)} className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> AI Assistant
              </Button>
              {(isEdit || sections.some(s => s.items.some(li => li.title))) && (
                <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5"><Download className="h-3.5 w-3.5" /> PDF</Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {isEdit && loadingExisting ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {!isEdit && (
                <div>
                  <Label className="text-xs text-muted-foreground">Trades Template</Label>
                  <Select value={templateKey} onValueChange={handleTemplateChange}>
                    <SelectTrigger><SelectValue placeholder="Start from template…" /></SelectTrigger>
                    <SelectContent>{TRADES_TEMPLATES.map(t => <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div><Label className="text-xs text-muted-foreground">Contact</Label><Select value={leadId} onValueChange={setLeadId}><SelectTrigger><SelectValue placeholder="Select contact…" /></SelectTrigger><SelectContent>{contacts.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs text-muted-foreground">Estimate #</Label><Input value={estimateNumber} onChange={e => setEstimateNumber(e.target.value)} /></div>
                <div><Label className="text-xs text-muted-foreground">Job Type</Label><Input value={jobType} onChange={e => setJobType(e.target.value)} placeholder="e.g. Bathroom Remodel" /></div>
                <div><Label className="text-xs text-muted-foreground">Issue Date</Label><Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
                <div><Label className="text-xs text-muted-foreground">Expiry Date</Label><Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} /></div>
                <div><Label className="text-xs text-muted-foreground">Job Address</Label><Input value={jobAddress} onChange={e => setJobAddress(e.target.value)} placeholder="123 Main St" /></div>
              </div>

              <div><Label className="text-xs text-muted-foreground">Scope of Work</Label><Textarea value={scope} onChange={e => setScope(e.target.value)} rows={2} placeholder="Describe the work…" /></div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-semibold">Sections & Line Items</Label>
                  <Button variant="outline" size="sm" onClick={addSection}><Plus className="h-3.5 w-3.5 mr-1" /> Add Section</Button>
                </div>
                <div className="space-y-3">
                  {sections.map((section, si) => (
                    <SectionBlock key={section._tempId ?? si} section={section} sectionIdx={si} canRemove={sections.length > 1}
                      onUpdateField={updateSectionField} onRemoveSection={() => removeSection(si)}
                      onUpdateLineItem={updateLineItem} onAddLineItem={() => addLineItem(si)}
                      onRemoveLineItem={(ii) => removeLineItem(si, ii)} presets={allPresets} />
                  ))}
                </div>
              </div>

              <Separator />

              <Collapsible open={showFinancials} onOpenChange={setShowFinancials}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                    {showFinancials ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    <Calculator className="h-3.5 w-3.5" /> Financial Controls
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div><Label className="text-xs text-muted-foreground">Discount $</Label><Input type="number" value={discountAmount} onChange={e => setDiscountAmount(+e.target.value)} min={0} step={0.01} /></div>
                    <div><Label className="text-xs text-muted-foreground">Discount %</Label><Input type="number" value={discountPercent} onChange={e => setDiscountPercent(+e.target.value)} min={0} max={100} /></div>
                    <div><Label className="text-xs text-muted-foreground">Deposit $</Label><Input type="number" value={depositAmount} onChange={e => setDepositAmount(+e.target.value)} min={0} step={0.01} /></div>
                    <div><Label className="text-xs text-muted-foreground">Deposit %</Label><Input type="number" value={depositPercent} onChange={e => setDepositPercent(+e.target.value)} min={0} max={100} /></div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Payment terms…" /></div>
                <div><Label className="text-xs text-muted-foreground">Terms & Conditions</Label><Textarea value={termsConditions} onChange={e => setTermsConditions(e.target.value)} rows={2} placeholder="Standard terms…" /></div>
              </div>
              <div><Label className="text-xs text-muted-foreground">Internal Notes (not visible to customer)</Label><Textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={2} placeholder="Margin notes…" className="border-dashed" /></div>
            </div>

            <div className="border-t border-border bg-muted/30 px-6 py-4">
              <div className="flex items-end justify-between gap-6">
                <div className="flex-1 grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-1 text-sm">
                  <div><span className="text-muted-foreground text-xs">Subtotal</span><br/><span className="tabular-nums">${totals.subtotal.toFixed(2)}</span></div>
                  {totals.labor_total > 0 && <div><span className="text-muted-foreground text-xs">Labor</span><br/><span className="tabular-nums">${totals.labor_total.toFixed(2)}</span></div>}
                  {totals.material_total > 0 && <div><span className="text-muted-foreground text-xs">Materials</span><br/><span className="tabular-nums">${totals.material_total.toFixed(2)}</span></div>}
                  {totals.discount_total > 0 && <div><span className="text-destructive text-xs">Discount</span><br/><span className="tabular-nums text-destructive">-${totals.discount_total.toFixed(2)}</span></div>}
                  {totals.tax_total > 0 && <div><span className="text-muted-foreground text-xs">Tax</span><br/><span className="tabular-nums">${totals.tax_total.toFixed(2)}</span></div>}
                  <div><span className="text-xs font-medium">Grand Total</span><br/><span className="tabular-nums text-lg font-bold">${totals.grand_total.toFixed(2)}</span></div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving || !estimateNumber}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isEdit ? "Update" : "Create Estimate"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
      <EstimateAssistantSheet
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        jobType={jobType}
        scope={scope}
        customerName={contacts.find((c: any) => c.id === leadId)?.name}
        jobAddress={jobAddress}
        existingItems={sections.flatMap(s => s.items)}
        onApplyLineItems={(items) => {
          setSections(prev => {
            const lastSection = prev[prev.length - 1];
            const hasEmptyOnly = lastSection.items.length === 1 && !lastSection.items[0].title;
            if (hasEmptyOnly) {
              return prev.map((s, i) => i === prev.length - 1 ? { ...s, items: items } : s);
            }
            return [...prev, { _tempId: crypto.randomUUID(), name: "AI Generated", notes: "", sort_order: prev.length, items }];
          });
        }}
        onApplyScope={setScope}
        onApplyTerms={setTermsConditions}
      />
    </Dialog>
  );
}

function SectionBlock({ section, sectionIdx, canRemove, onUpdateField, onRemoveSection, onUpdateLineItem, onAddLineItem, onRemoveLineItem, presets }: {
  section: EstimateSection; sectionIdx: number; canRemove: boolean;
  onUpdateField: (idx: number, field: string, value: string) => void; onRemoveSection: () => void;
  onUpdateLineItem: (si: number, ii: number, field: string, value: any) => void;
  onAddLineItem: () => void; onRemoveLineItem: (ii: number) => void; presets: any[];
}) {
  const [open, setOpen] = useState(true);
  const sectionTotal = section.items.reduce((sum, li) => sum + (li.is_optional ? 0 : li.line_total), 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-border bg-card">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/30">
            <div className="flex items-center gap-2 flex-1">
              {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              <Input value={section.name} onChange={e => { e.stopPropagation(); onUpdateField(sectionIdx, "name", e.target.value); }} onClick={e => e.stopPropagation()} className="h-7 text-sm font-medium border-0 bg-transparent p-0 focus-visible:ring-0 w-48" placeholder="Section name" />
              <span className="text-xs text-muted-foreground tabular-nums">${sectionTotal.toFixed(2)}</span>
              <Badge variant="outline" className="text-[10px]">{section.items.length} items</Badge>
            </div>
            {canRemove && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); onRemoveSection(); }}><Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" /></Button>}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            <Input value={section.notes ?? ""} onChange={e => onUpdateField(sectionIdx, "notes", e.target.value)} placeholder="Section notes (optional)" className="h-7 text-xs" />
            {section.items.map((item, ii) => (
              <LineItemRow key={ii} item={item} onUpdate={(field, value) => onUpdateLineItem(sectionIdx, ii, field, value)} onRemove={() => onRemoveLineItem(ii)} canRemove={section.items.length > 1} presets={presets} />
            ))}
            <Button variant="ghost" size="sm" onClick={onAddLineItem} className="text-xs gap-1"><Plus className="h-3 w-3" /> Add Item</Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function LineItemRow({ item, onUpdate, onRemove, canRemove, presets }: {
  item: EstimateLineItem; onUpdate: (field: string, value: any) => void; onRemove: () => void; canRemove: boolean; presets: any[];
}) {
  const dimFields = dimensionFieldsForMode(item.calc_mode);
  return (
    <div className={`rounded border border-border/60 p-2.5 space-y-2 ${item.is_optional ? "bg-muted/30 border-dashed" : "bg-muted/10"}`}>
      <div className="flex items-center gap-2">
        <Input placeholder="Item title" value={item.title} onChange={e => onUpdate("title", e.target.value)} className="h-7 text-sm flex-1" />
        <Select value={item.calc_mode} onValueChange={v => onUpdate("calc_mode", v)}>
          <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{CALC_MODES.map(m => <SelectItem key={m.value} value={m.value}><span className="text-xs">{m.label}</span></SelectItem>)}</SelectContent>
        </Select>
        <div className="flex items-center gap-1"><Switch checked={item.is_optional} onCheckedChange={v => onUpdate("is_optional", v)} className="scale-75" /><span className="text-[10px] text-muted-foreground">Opt</span></div>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onRemove} disabled={!canRemove}><Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" /></Button>
      </div>
      <Input placeholder="Description (optional)" value={item.description ?? ""} onChange={e => onUpdate("description", e.target.value)} className="h-6 text-xs" />
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
        {dimFields.includes("length") && <div><Label className="text-[10px] text-muted-foreground">Length</Label><Input type="number" value={item.calc_length} onChange={e => onUpdate("calc_length", +e.target.value)} min={0} step={0.1} className="h-7 text-xs" /></div>}
        {dimFields.includes("width") && <div><Label className="text-[10px] text-muted-foreground">Width</Label><Input type="number" value={item.calc_width} onChange={e => onUpdate("calc_width", +e.target.value)} min={0} step={0.1} className="h-7 text-xs" /></div>}
        {dimFields.includes("depth") && <div><Label className="text-[10px] text-muted-foreground">Depth</Label><Input type="number" value={item.calc_depth} onChange={e => onUpdate("calc_depth", +e.target.value)} min={0} step={0.1} className="h-7 text-xs" /></div>}
        <div><Label className="text-[10px] text-muted-foreground">Qty</Label><Input type="number" value={item.quantity} onChange={e => onUpdate("quantity", +e.target.value)} min={0} className="h-7 text-xs" readOnly={item.calc_mode !== "unit_count"} /></div>
        <div><Label className="text-[10px] text-muted-foreground">Unit</Label><Input value={item.unit} onChange={e => onUpdate("unit", e.target.value)} className="h-7 text-xs" /></div>
        <div><Label className="text-[10px] text-muted-foreground">Unit $</Label><Input type="number" value={item.unit_price} onChange={e => onUpdate("unit_price", +e.target.value)} min={0} step={0.01} className="h-7 text-xs" /></div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        <div><Label className="text-[10px] text-muted-foreground">Labor Hrs</Label><Input type="number" value={item.labor_hours} onChange={e => onUpdate("labor_hours", +e.target.value)} min={0} step={0.5} className="h-7 text-xs" /></div>
        <div><Label className="text-[10px] text-muted-foreground">Labor Rate</Label><div className="flex gap-0.5"><Input type="number" value={item.labor_rate} onChange={e => onUpdate("labor_rate", +e.target.value)} min={0} step={0.01} className="h-7 text-xs" /><PresetButton presets={presets} type="labor_rate" onSelect={v => onUpdate("labor_rate", v)} /></div></div>
        <div><Label className="text-[10px] text-muted-foreground">Material $</Label><Input type="number" value={item.material_cost} onChange={e => onUpdate("material_cost", +e.target.value)} min={0} step={0.01} className="h-7 text-xs" /></div>
        <div><Label className="text-[10px] text-muted-foreground">Markup %</Label><div className="flex gap-0.5"><Input type="number" value={item.markup_percent} onChange={e => onUpdate("markup_percent", +e.target.value)} min={0} className="h-7 text-xs" /><PresetButton presets={presets} type="markup" onSelect={v => onUpdate("markup_percent", v)} /></div></div>
        <div><Label className="text-[10px] text-muted-foreground">Tax %</Label><div className="flex gap-0.5"><Input type="number" value={item.tax_percent} onChange={e => onUpdate("tax_percent", +e.target.value)} min={0} className="h-7 text-xs" /><PresetButton presets={presets} type="tax" onSelect={v => onUpdate("tax_percent", v)} /></div></div>
        <div><Label className="text-[10px] text-muted-foreground">Total</Label><Input value={`$${item.line_total.toFixed(2)}`} readOnly className="h-7 text-xs bg-muted/40 tabular-nums font-medium" /></div>
      </div>
    </div>
  );
}

function PresetButton({ presets, type, onSelect }: { presets: any[]; type: PresetType; onSelect: (v: number) => void }) {
  const filtered = presets.filter((p: any) => p.preset_type === type);
  if (filtered.length === 0) return null;
  return (
    <Popover>
      <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-6 shrink-0"><Bookmark className="h-3 w-3 text-muted-foreground" /></Button></PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end">
        {filtered.map((p: any) => (
          <button key={p.id ?? p.name} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted flex justify-between" onClick={() => onSelect(p.value)}>
            <span>{p.name}</span>
            <span className="text-muted-foreground tabular-nums">{type === "markup" || type === "tax" ? `${p.value}%` : `$${p.value}`}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
