import { useState } from "react";
import { Plus, Loader2, FileText, Copy, Send, Trash2, MoreHorizontal, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import {
  useEstimates, useDeleteEstimate, useUpdateEstimateStatus, useCreateEstimate,
  generateEstimateNumber, type EstimateStatus
} from "@/hooks/useEstimates";
import EstimateBuilderDialog from "@/components/estimates/EstimateBuilderDialog";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const STATUS_COLORS: Record<EstimateStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  viewed: "bg-accent/60 text-accent-foreground",
  approved: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  declined: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground/60",
};

export default function EstimatesPage() {
  const { data: estimates = [], isLoading } = useEstimates();
  const deleteEstimate = useDeleteEstimate();
  const updateStatus = useUpdateEstimateStatus();
  const createEstimate = useCreateEstimate();
  const { planKey } = usePlanLimits();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const isFree = planKey === "free";
  const thisMonth = estimates.filter((e: any) => {
    const d = new Date(e.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const limitReached = isFree && thisMonth.length >= 3;

  const filtered = estimates.filter((e: any) => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const name = e.leads?.name?.toLowerCase() ?? "";
      const num = e.estimate_number?.toLowerCase() ?? "";
      if (!name.includes(s) && !num.includes(s)) return false;
    }
    return true;
  });

  const handleDuplicate = async (est: any) => {
    const newNum = generateEstimateNumber();
    // Fetch line items for original
    const { data: items } = await (await import("@/integrations/supabase/client")).supabase
      .from("estimate_line_items")
      .select("*")
      .eq("estimate_id", est.id)
      .order("sort_order");

    await createEstimate.mutateAsync({
      lead_id: est.lead_id,
      booking_id: est.booking_id,
      estimate_number: newNum,
      status: "draft",
      issue_date: new Date().toISOString().split("T")[0],
      expiry_date: est.expiry_date,
      job_address: est.job_address,
      job_type: est.job_type,
      scope_of_work: est.scope_of_work,
      notes: est.notes,
      template_key: est.template_key,
      line_items: (items ?? []).map((li: any) => ({
        title: li.title,
        description: li.description,
        quantity: li.quantity,
        unit: li.unit,
        unit_price: li.unit_price,
        labor_hours: li.labor_hours,
        labor_rate: li.labor_rate,
        material_cost: li.material_cost,
        markup_percent: li.markup_percent,
        tax_percent: li.tax_percent,
        line_total: li.line_total,
        sort_order: li.sort_order,
      })),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estimates</h1>
          <p className="text-muted-foreground text-sm mt-1">Create, send, and track customer estimates</p>
        </div>
        <Button
          className="shadow-glow"
          onClick={() => { setEditId(null); setDialogOpen(true); }}
          disabled={limitReached}
        >
          <Plus className="h-4 w-4 mr-2" /> New Estimate
        </Button>
      </div>

      {limitReached && (
        <UpgradePrompt
          title="Estimate limit reached"
          description="Free plan allows 3 estimates per month. Upgrade for unlimited estimates, branded PDFs, and approval workflows."
        />
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search estimates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <Filter className="h-3.5 w-3.5 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="dash-card p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No estimates yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first estimate to get started.</p>
          <Button onClick={() => { setEditId(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> New Estimate
          </Button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dash-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estimate #</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Job Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((est: any) => (
                <TableRow
                  key={est.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => { setEditId(est.id); setDialogOpen(true); }}
                >
                  <TableCell className="font-mono text-sm">{est.estimate_number}</TableCell>
                  <TableCell>{est.leads?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{est.job_type ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className={`capitalize ${STATUS_COLORS[est.status as EstimateStatus] ?? ""}`}>
                      {est.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    ${Number(est.grand_total ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {est.issue_date ? format(new Date(est.issue_date), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {est.expiry_date ? format(new Date(est.expiry_date), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {est.status === "draft" && (
                          <DropdownMenuItem onClick={() => updateStatus.mutate({ id: est.id, status: "sent", lead_id: est.lead_id, estimate_number: est.estimate_number })}>
                            <Send className="h-3.5 w-3.5 mr-2" /> Mark Sent
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDuplicate(est)}>
                          <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteEstimate.mutate(est.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}

      <EstimateBuilderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editId={editId}
      />
    </div>
  );
}
