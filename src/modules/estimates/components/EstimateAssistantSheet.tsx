import { useState, useRef, useEffect } from "react";
import {
  Sparkles, FileText, DollarSign, ListChecks, TrendingUp, ShieldCheck,
  Loader2, Copy, RotateCcw, CheckCircle2, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { EstimateLineItem } from "@/hooks/useEstimates";
import { calculateLineTotals } from "@/hooks/useEstimates";

interface EstimateAssistantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobType?: string;
  scope?: string;
  customerName?: string;
  jobAddress?: string;
  existingItems?: EstimateLineItem[];
  onApplyLineItems?: (items: EstimateLineItem[]) => void;
  onApplyScope?: (scope: string) => void;
  onApplyTerms?: (terms: string) => void;
}

type AssistAction = "generate_line_items" | "write_scope" | "write_terms" | "review_estimate" | "suggest_upsells";

const ACTIONS: { key: AssistAction; label: string; icon: typeof Sparkles; description: string }[] = [
  { key: "generate_line_items", label: "Generate Line Items", icon: ListChecks, description: "AI creates itemized estimate from job details" },
  { key: "write_scope", label: "Write Scope of Work", icon: FileText, description: "Professional scope description for your estimate" },
  { key: "review_estimate", label: "Review Estimate", icon: ShieldCheck, description: "Get pricing & completeness feedback" },
  { key: "suggest_upsells", label: "Suggest Add-ons", icon: TrendingUp, description: "Optional upsell items to increase revenue" },
  { key: "write_terms", label: "Write Terms", icon: DollarSign, description: "Professional terms & conditions" },
];

const FUNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-assist`;

export default function EstimateAssistantSheet({
  open, onOpenChange, jobType, scope, customerName, jobAddress,
  existingItems, onApplyLineItems, onApplyScope, onApplyTerms,
}: EstimateAssistantSheetProps) {
  const { user } = useAuth();
  const [selectedAction, setSelectedAction] = useState<AssistAction | null>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState("");
  const [parsedItems, setParsedItems] = useState<EstimateLineItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [result]);

  useEffect(() => {
    if (open) {
      setSelectedAction(null);
      setResult("");
      setNotes("");
      setParsedItems(null);
    }
  }, [open]);

  const runAssist = async () => {
    if (!selectedAction) return;
    setIsLoading(true);
    setResult("");
    setParsedItems(null);

    try {
      const body = {
        action: selectedAction,
        job_type: jobType,
        scope,
        notes: notes.trim() || undefined,
        customer_name: customerName,
        job_address: jobAddress,
        existing_items: existingItems?.filter(i => i.title)?.map(i => ({
          title: i.title, quantity: i.quantity, unit: i.unit,
          unit_price: i.unit_price, labor_hours: i.labor_hours,
          labor_rate: i.labor_rate, material_cost: i.material_cost,
        })),
      };

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Please sign in to use the AI assistant");

      const resp = await fetch(FUNC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        if (resp.status === 429) toast.error("Rate limit exceeded. Try again shortly.");
        else if (resp.status === 402) toast.error("AI credits exhausted.");
        throw new Error(err.error || "Request failed");
      }

      // JSON response for line items
      if (selectedAction === "generate_line_items") {
        const data = await resp.json();
        let content = data.result || "[]";
        try {
          // Parse the JSON - might be wrapped in an object
          let parsed = JSON.parse(content);
          if (parsed && !Array.isArray(parsed)) {
            // Find the array in the object
            const keys = Object.keys(parsed);
            for (const key of keys) {
              if (Array.isArray(parsed[key])) { parsed = parsed[key]; break; }
            }
          }
          if (Array.isArray(parsed)) {
            const items: EstimateLineItem[] = parsed.map((item: any, i: number) =>
              calculateLineTotals({
                title: item.title || "",
                description: item.description || "",
                quantity: Number(item.quantity) || 1,
                unit: item.unit || "each",
                unit_price: Number(item.unit_price) || 0,
                labor_hours: Number(item.labor_hours) || 0,
                labor_rate: Number(item.labor_rate) || 0,
                material_cost: Number(item.material_cost) || 0,
                markup_percent: Number(item.markup_percent) || 0,
                tax_percent: Number(item.tax_percent) || 0,
                line_total: 0,
                sort_order: i,
                calc_mode: "unit_count",
                calc_length: 0, calc_width: 0, calc_depth: 0,
                is_optional: false,
              })
            );
            setParsedItems(items);
            const total = items.reduce((s, i) => s + i.line_total, 0);
            setResult(`Generated ${items.length} line items totaling $${total.toFixed(2)}`);
          } else {
            setResult("Could not parse line items. Please try again.");
          }
        } catch {
          setResult("Could not parse AI response. Please try again.");
        }
        return;
      }

      // Streaming response for text actions
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) { fullText += content; setResult(fullText); }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) { fullText += content; setResult(fullText); }
          } catch { /* ignore */ }
        }
      }
    } catch (err: any) {
      console.error("Estimate assist error:", err);
      if (!result) setResult(`Something went wrong: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard");
  };

  const handleApplyLineItems = () => {
    if (parsedItems && onApplyLineItems) {
      onApplyLineItems(parsedItems);
      toast.success(`${parsedItems.length} line items added to estimate`);
      onOpenChange(false);
    }
  };

  const handleApplyScope = () => {
    if (onApplyScope && result) {
      onApplyScope(result);
      toast.success("Scope of work applied");
      onOpenChange(false);
    }
  };

  const handleApplyTerms = () => {
    if (onApplyTerms && result) {
      onApplyTerms(result);
      toast.success("Terms applied");
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Estimate Assistant
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Action Selection */}
          {!selectedAction && !result && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">How can I help with this estimate?</p>
              {ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.key}
                    onClick={() => setSelectedAction(a.key)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border hover:bg-muted/50 active:scale-[0.98] transition-all text-left"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{a.label}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Input Phase */}
          {selectedAction && !result && !isLoading && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={() => setSelectedAction(null)}>
                ← Back
              </Button>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{ACTIONS.find(a => a.key === selectedAction)?.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedAction === "generate_line_items" && "I'll create detailed line items with realistic pricing based on your job type and location."}
                    {selectedAction === "write_scope" && "I'll write a professional scope of work based on the estimate details."}
                    {selectedAction === "write_terms" && "I'll generate standard terms & conditions for your trade."}
                    {selectedAction === "review_estimate" && "I'll analyze your current estimate for pricing, completeness, and win rate."}
                    {selectedAction === "suggest_upsells" && "I'll suggest add-on items to increase your estimate value."}
                  </p>
                </div>
              </div>

              {/* Context summary */}
              {(jobType || scope) && (
                <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Current estimate context:</p>
                  {jobType && <p className="text-xs text-foreground">Job type: {jobType}</p>}
                  {scope && <p className="text-xs text-foreground line-clamp-2">Scope: {scope}</p>}
                  {existingItems && existingItems.filter(i => i.title).length > 0 && (
                    <p className="text-xs text-foreground">{existingItems.filter(i => i.title).length} existing line items</p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Additional notes (optional)</p>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. customer wants premium materials, 2-story house, etc."
                  rows={3}
                />
              </div>

              <Button size="lg" className="w-full gap-2" onClick={runAssist}>
                <Sparkles className="h-4 w-4" /> Generate
              </Button>
            </div>
          )}

          {/* Loading */}
          {isLoading && !result && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {selectedAction === "generate_line_items" ? "Generating line items..." : "Writing..."}
              </p>
            </div>
          )}

          {/* Line Items Result */}
          {parsedItems && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">{result}</p>
              </div>
              <div className="space-y-2">
                {parsedItems.map((item, i) => (
                  <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <span className="text-sm font-semibold tabular-nums">${item.line_total.toFixed(2)}</span>
                    </div>
                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                    <div className="flex gap-3 text-[11px] text-muted-foreground">
                      <span>{item.quantity} {item.unit}</span>
                      <span>@ ${item.unit_price.toFixed(2)}</span>
                      {item.labor_hours > 0 && <span>{item.labor_hours}h labor</span>}
                      {item.material_cost > 0 && <span>${item.material_cost.toFixed(2)} materials</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Text Result */}
          {result && !parsedItems && (
            <div className="space-y-3">
              <div className="rounded-xl bg-muted/40 border border-border p-4">
                <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </div>
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Generating...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        {result && !isLoading && (
          <div className="border-t border-border px-4 py-3 shrink-0 space-y-2">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={handleCopy}>
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => { setResult(""); setParsedItems(null); }}>
                <RotateCcw className="h-4 w-4" /> Regenerate
              </Button>
            </div>

            {/* Apply buttons */}
            {parsedItems && onApplyLineItems && (
              <Button className="w-full gap-2" onClick={handleApplyLineItems}>
                <CheckCircle2 className="h-4 w-4" /> Add {parsedItems.length} Items to Estimate
              </Button>
            )}
            {selectedAction === "write_scope" && onApplyScope && (
              <Button className="w-full gap-2" onClick={handleApplyScope}>
                <CheckCircle2 className="h-4 w-4" /> Apply Scope of Work
              </Button>
            )}
            {selectedAction === "write_terms" && onApplyTerms && (
              <Button className="w-full gap-2" onClick={handleApplyTerms}>
                <CheckCircle2 className="h-4 w-4" /> Apply Terms & Conditions
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
