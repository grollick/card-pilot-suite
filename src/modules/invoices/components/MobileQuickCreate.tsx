import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, DollarSign, Plus, Loader2, X, ChevronRight,
  Sparkles, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useContacts } from "@/hooks/useContacts";
import { useCreateInvoice, generateInvoiceNumber } from "@/hooks/useInvoices";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import UpgradePrompt from "@/components/UpgradePrompt";

const QUICK_PRICES = [50, 100, 150, 250, 500, 1000];

interface MobileLineItem {
  title: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export default function MobileQuickCreate() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<null | "estimate" | "invoice">(null);

  return (
    <>
      {/* Floating action buttons - shown on mobile */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2 md:hidden">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <Button
            size="lg"
            className="h-14 w-14 rounded-2xl shadow-lg shadow-primary/25"
            onClick={() => setMode("invoice")}
          >
            <DollarSign className="h-6 w-6" />
          </Button>
        </motion.div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
        >
          <Button
            size="lg"
            variant="secondary"
            className="h-14 w-14 rounded-2xl shadow-lg"
            onClick={() => setMode("estimate")}
          >
            <FileText className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>

      {/* Quick create sheets */}
      <MobileInvoiceSheet
        open={mode === "invoice"}
        onClose={() => setMode(null)}
      />
      {mode === "estimate" && (
        <Sheet open onOpenChange={() => setMode(null)}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
            <SheetHeader className="px-5 pt-5 pb-3">
              <SheetTitle className="text-left">Quick Estimate</SheetTitle>
            </SheetHeader>
            <div className="px-5 pb-8 text-center text-muted-foreground">
              <p className="text-sm">
                Use the full estimate builder for detailed quotes.
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setMode(null);
                  navigate("/app/estimates");
                }}
              >
                <FileText className="h-4 w-4 mr-2" /> Open Estimate Builder
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

function MobileInvoiceSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { data: contacts = [] } = useContacts();
  const createInvoice = useCreateInvoice();
  const { planKey, checkLimit } = usePlanLimits();

  const [step, setStep] = useState(0);
  const [leadId, setLeadId] = useState("");
  const [items, setItems] = useState<MobileLineItem[]>([
    { title: "", description: "", quantity: 1, unit_price: 0, line_total: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.line_total, 0);

  const addItem = () =>
    setItems([
      ...items,
      { title: "", description: "", quantity: 1, unit_price: 0, line_total: 0 },
    ]);

  const duplicateItem = (idx: number) => {
    const next = [...items];
    next.splice(idx + 1, 0, { ...items[idx] });
    setItems(next);
  };

  const removeItem = (idx: number) =>
    setItems(items.filter((_, i) => i !== idx));

  const updateItem = (
    idx: number,
    field: keyof MobileLineItem,
    value: any
  ) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    if (field === "quantity" || field === "unit_price") {
      updated[idx].line_total =
        Number(updated[idx].quantity) * Number(updated[idx].unit_price);
    }
    setItems(updated);
  };

  const setQuickPrice = (idx: number, price: number) => {
    updateItem(idx, "unit_price", price);
  };

  const handleCreate = async () => {
    await createInvoice.mutateAsync({
      lead_id: leadId || null,
      subtotal,
      grand_total: subtotal,
      notes,
      line_items: items.filter((i) => i.title),
    });
    onClose();
    setStep(0);
    setItems([{ title: "", description: "", quantity: 1, unit_price: 0, line_total: 0 }]);
    setLeadId("");
    setNotes("");
  };

  const resetAndClose = () => {
    onClose();
    setStep(0);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={resetAndClose}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0 flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-3 shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-left">
                {step === 0 ? "Select Customer" : step === 1 ? "Add Items" : "Review"}
              </SheetTitle>
              <div className="flex gap-1">
                {[0, 1, 2].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 w-6 rounded-full transition-colors ${
                      s <= step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 pb-32">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <Select value={leadId} onValueChange={setLeadId}>
                    <SelectTrigger className="h-14 text-base">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((c: any) => (
                        <SelectItem key={c.id} value={c.id} className="text-base py-3">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground text-center">
                    Or skip to create without a customer
                  </p>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border p-4 space-y-3 bg-muted/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Item {idx + 1}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => duplicateItem(idx)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                          {items.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeItem(idx)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <Input
                        placeholder="Service name"
                        value={item.title}
                        onChange={(e) => updateItem(idx, "title", e.target.value)}
                        className="h-12 text-base"
                      />

                      <Input
                        placeholder="Description (optional)"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(idx, "description", e.target.value)
                        }
                        className="h-10"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Qty</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(idx, "quantity", Number(e.target.value))
                            }
                            className="h-12 text-base text-center"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Price</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={item.unit_price || ""}
                              onChange={(e) =>
                                updateItem(idx, "unit_price", Number(e.target.value))
                              }
                              className="h-12 text-base pl-7"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Quick price buttons */}
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_PRICES.map((p) => (
                          <Button
                            key={p}
                            variant={item.unit_price === p ? "default" : "outline"}
                            size="sm"
                            className="h-9 px-3 text-xs"
                            onClick={() => setQuickPrice(idx, p)}
                          >
                            ${p}
                          </Button>
                        ))}
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-bold tabular-nums">
                          ${item.line_total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full h-12"
                    onClick={addItem}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Another Item
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Summary */}
                  <div className="rounded-xl border border-border p-4 space-y-3">
                    {items
                      .filter((i) => i.title)
                      .map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × ${item.unit_price}
                            </p>
                          </div>
                          <span className="font-semibold tabular-nums">
                            ${item.line_total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    <Separator />
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold tabular-nums">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Notes (optional)
                    </Label>
                    <Textarea
                      placeholder="Thank you for your business..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="text-base"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom action bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-5 py-4 safe-bottom">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold tabular-nums">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2">
              {step > 0 && (
                <Button
                  variant="outline"
                  className="h-12 flex-1"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
              )}
              {step < 2 ? (
                <Button
                  className="h-12 flex-1"
                  onClick={() => setStep(step + 1)}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  className="h-12 flex-1 shadow-glow"
                  onClick={handleCreate}
                  disabled={
                    createInvoice.isPending ||
                    !items.some((i) => i.title && i.unit_price > 0)
                  }
                >
                  {createInvoice.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Create Invoice
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <UpgradePrompt
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        feature="invoice"
        currentPlan={planKey}
      />
    </>
  );
}
