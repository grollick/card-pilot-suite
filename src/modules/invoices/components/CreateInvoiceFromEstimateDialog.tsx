import { useState } from "react";
import { FileText, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useEstimates } from "@/hooks/useEstimates";
import { useCreateInvoiceFromEstimate } from "@/hooks/useInvoices";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export default function CreateInvoiceFromEstimateDialog({ open, onOpenChange, onCreated }: Props) {
  const { data: estimates = [], isLoading } = useEstimates();
  const createFromEstimate = useCreateInvoiceFromEstimate();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Show estimates that can be invoiced (approved, sent, or viewed)
  const eligible = (estimates as any[]).filter(
    (e) => ["approved", "sent", "viewed", "draft"].includes(e.status)
  );

  const handleCreate = async () => {
    if (!selectedId) return;
    await createFromEstimate.mutateAsync(selectedId);
    setSelectedId(null);
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Invoice from Estimate</DialogTitle>
          <DialogDescription>
            Select an estimate to convert into a draft invoice. Line items will be copied automatically.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : eligible.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No estimates available to convert.</p>
            <p className="text-xs text-muted-foreground mt-1">Create an estimate first, then come back here.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {eligible.map((est: any) => (
              <button
                key={est.id}
                onClick={() => setSelectedId(est.id === selectedId ? null : est.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedId === est.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/30 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold">{est.estimate_number}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {est.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {est.leads?.name || "No customer"}{est.job_type ? ` • ${est.job_type}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold tabular-nums text-sm">
                      ${Number(est.grand_total || 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {est.issue_date ? format(new Date(est.issue_date + "T00:00:00"), "MMM d, yyyy") : ""}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!selectedId || createFromEstimate.isPending}
            onClick={handleCreate}
          >
            {createFromEstimate.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
            Create Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
