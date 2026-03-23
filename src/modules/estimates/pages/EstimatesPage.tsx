import { useState } from "react";
import {
  Plus, Loader2, FileText, Copy, Send, Trash2, MoreHorizontal,
  Search, Filter, CheckCircle2, XCircle, Eye, Download, CalendarCheck,
  FileBarChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { format, addHours } from "date-fns";
import {
  useEstimates, useDeleteEstimate, useUpdateEstimateStatus, useDuplicateEstimate,
  useConvertEstimateToJob, useConvertEstimateToInvoice,
  type EstimateStatus, type EstimateSection, calculateEstimateTotals,
} from "@/hooks/useEstimates";
import { usePipelineStages } from "@/hooks/useContacts";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { exportEstimatePDF } from "@/lib/estimatePdf";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EstimateBuilderDialog from "@/modules/estimates/components/EstimateBuilderDialog";
import DocumentStatusBadge from "@/components/DocumentStatusBadge";
import { Badge } from "@/components/ui/badge";

const VALID_TRANSITIONS: Record<EstimateStatus, EstimateStatus[]> = {
  draft: ["sent"],
  sent: ["viewed", "approved", "declined", "expired"],
  viewed: ["approved", "declined", "expired"],
  approved: [],
  declined: ["draft"],
  expired: ["draft"],
};

export default function EstimatesPage() {
  const { data: estimates = [], isLoading } = useEstimates();
  const deleteEstimate = useDeleteEstimate();
  const updateStatus = useUpdateEstimateStatus();
  const duplicateEstimate = useDuplicateEstimate();
  const convertToJob = useConvertEstimateToJob();
  const convertToInvoice = useConvertEstimateToInvoice();
  const { data: stages = [] } = usePipelineStages();
  const { planKey, profile } = usePlanLimits();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    est: any;
    action: "approved" | "declined";
  } | null>(null);
  const [convertDialog, setConvertDialog] = useState<any>(null);
  const [convertDate, setConvertDate] = useState("");
  const [convertTime, setConvertTime] = useState("09:00");

  const isFree = planKey === "starter";
  const thisMonth = estimates.filter((e: any) => {
    const d = new Date(e.created_at);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const limitReached = isFree && thisMonth.length >= 3;

  const filtered = estimates.filter((e: any) => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !(e.leads?.name?.toLowerCase() ?? "").includes(s) &&
        !(e.estimate_number?.toLowerCase() ?? "").includes(s)
      )
        return false;
    }
    return true;
  });

  const wonStage = stages.find((s: any) => s.is_won);
  const lostStage = stages.find((s: any) => s.is_lost);

  const handleStatusChange = (est: any, newStatus: EstimateStatus) => {
    if (newStatus === "approved" || newStatus === "declined") {
      setConfirmAction({ est, action: newStatus });
      return;
    }
    updateStatus.mutate({
      id: est.id,
      status: newStatus,
      lead_id: est.lead_id,
      estimate_number: est.estimate_number,
    });
  };

  const handleConfirmedAction = () => {
    if (!confirmAction) return;
    const { est, action } = confirmAction;
    const pipelineStage =
      action === "approved" && wonStage
        ? { stageId: wonStage.id }
        : action === "declined" && lostStage
          ? { stageId: lostStage.id }
          : null;
    updateStatus.mutate({
      id: est.id,
      status: action,
      lead_id: est.lead_id,
      estimate_number: est.estimate_number,
      updatePipelineStage: pipelineStage,
    });
    setConfirmAction(null);
  };

  const handleConvertToJob = () => {
    if (!convertDialog || !convertDate) return;
    const start = new Date(`${convertDate}T${convertTime}`);
    convertToJob.mutate({
      estimateId: convertDialog.id,
      leadId: convertDialog.lead_id,
      estimateNumber: convertDialog.estimate_number,
      startDatetime: start.toISOString(),
      endDatetime: addHours(start, 2).toISOString(),
    });
    setConvertDialog(null);
    setConvertDate("");
    setConvertTime("09:00");
  };

  const handleExportPDF = async (est: any) => {
    const { data: items } = await supabase
      .from("estimate_line_items")
      .select("*")
      .eq("estimate_id", est.id)
      .order("sort_order");
    const { data: sections } = await supabase
      .from("estimate_sections" as any)
      .select("*")
      .eq("estimate_id", est.id)
      .order("sort_order");
    const itemsList = (items ?? []) as any[];
    const sectionsList = (sections ?? []) as any[];
    let formSections: EstimateSection[];
    if (sectionsList.length > 0) {
      formSections = sectionsList.map((s: any) => ({
        name: s.name,
        notes: s.notes,
        sort_order: s.sort_order,
        items: itemsList.filter((li: any) => li.section_id === s.id),
      }));
      const unsectioned = itemsList.filter((li: any) => !li.section_id);
      if (unsectioned.length > 0)
        formSections.push({
          name: "General",
          sort_order: 99,
          items: unsectioned,
        });
    } else {
      formSections = [{ name: "General", sort_order: 0, items: itemsList }];
    }
    const totals = calculateEstimateTotals(formSections, {
      discount_amount: Number(est.discount_amount) || 0,
      discount_percent: Number(est.discount_percent) || 0,
      deposit_amount: Number(est.deposit_amount) || 0,
      deposit_percent: Number(est.deposit_percent) || 0,
    });
    exportEstimatePDF({
      estimate: { ...est, leads: est.leads },
      sections: formSections,
      totals,
      profile: profile as any,
      planKey,
    });
  };

  const approved = estimates.filter((e: any) => e.status === "approved");
  const declined = estimates.filter((e: any) => e.status === "declined");
  const sent = estimates.filter((e: any) =>
    ["sent", "viewed", "approved", "declined"].includes(e.status)
  );
  const approvalRate =
    sent.length > 0 ? Math.round((approved.length / sent.length) * 100) : 0;
  const totalApproved = approved.reduce(
    (sum: number, e: any) => sum + Number(e.grand_total || 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><span className="font-extrabold text-primary">guzzl</span> <span className="font-normal">Estimates</span></h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create, send, and track customer estimates
          </p>
        </div>
        <Button
          className="shadow-glow"
          onClick={() => {
            setEditId(null);
            setDialogOpen(true);
          }}
          disabled={limitReached}
        >
          <Plus className="h-4 w-4 mr-2" /> New Estimate
        </Button>
      </motion.div>

      {/* KPI Cards */}
      {estimates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="dash-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Total Sent
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">{sent.length}</p>
          </div>
          <div className="dash-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Approval Rate
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1">
              {approvalRate}%
            </p>
          </div>
          <div className="dash-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Approved Value
            </p>
            <p className="text-2xl font-bold tabular-nums text-success mt-1">
              ${totalApproved.toLocaleString("en-US", {
                minimumFractionDigits: 0,
              })}
            </p>
          </div>
          <div className="dash-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Declined
            </p>
            <p className="text-2xl font-bold tabular-nums text-destructive mt-1">
              {declined.length}
            </p>
          </div>
        </motion.div>
      )}

      {limitReached && (
        <Alert>
          <AlertTitle>Estimate limit reached</AlertTitle>
          <AlertDescription>
            Free plan allows 3 estimates per month. Upgrade for unlimited.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search estimates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9">
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

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="dash-card p-12 text-center"
        >
          <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No estimates yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first estimate to get started.
          </p>
          <Button
            onClick={() => {
              setEditId(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> New Estimate
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="dash-card overflow-hidden"
        >
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
              {filtered.map((est: any) => {
                const nextStatuses =
                  VALID_TRANSITIONS[est.status as EstimateStatus] ?? [];
                const isApproved = est.status === "approved";
                const isConverted = !!(est as any).converted_booking_id;
                return (
                  <TableRow
                    key={est.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => {
                      setEditId(est.id);
                      setDialogOpen(true);
                    }}
                  >
                    <TableCell className="font-mono text-sm">
                      {est.estimate_number}
                    </TableCell>
                    <TableCell>{est.leads?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {est.job_type ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <DocumentStatusBadge status={est.status} size="sm" />
                        {isConverted && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-4 px-1.5"
                          >
                            Job
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      $
                      {Number(est.grand_total ?? 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {est.issue_date
                        ? format(
                            new Date(est.issue_date + "T00:00:00"),
                            "MMM d, yyyy"
                          )
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {est.expiry_date
                        ? format(
                            new Date(est.expiry_date + "T00:00:00"),
                            "MMM d, yyyy"
                          )
                        : "—"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {nextStatuses.includes("sent") && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(est, "sent")}
                            >
                              <Send className="h-3.5 w-3.5 mr-2" /> Mark Sent
                            </DropdownMenuItem>
                          )}
                          {nextStatuses.includes("viewed") && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(est, "viewed")}
                            >
                              <Eye className="h-3.5 w-3.5 mr-2" /> Mark Viewed
                            </DropdownMenuItem>
                          )}
                          {nextStatuses.includes("approved") && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(est, "approved")
                              }
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-success" />{" "}
                              Approve
                            </DropdownMenuItem>
                          )}
                          {nextStatuses.includes("declined") && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(est, "declined")
                              }
                            >
                              <XCircle className="h-3.5 w-3.5 mr-2 text-destructive" />{" "}
                              Decline
                            </DropdownMenuItem>
                          )}
                          {nextStatuses.includes("draft") && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(est, "draft")}
                            >
                              <FileText className="h-3.5 w-3.5 mr-2" /> Revert
                              to Draft
                            </DropdownMenuItem>
                          )}
                          {isApproved && !isConverted && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setConvertDialog(est);
                                  setConvertDate(
                                    new Date().toISOString().split("T")[0]
                                  );
                                }}
                              >
                                <CalendarCheck className="h-3.5 w-3.5 mr-2" />{" "}
                                Convert to Job
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  convertToInvoice.mutate({
                                    estimateId: est.id,
                                  })
                                }
                              >
                                <FileBarChart className="h-3.5 w-3.5 mr-2" />{" "}
                                Convert to Invoice
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleExportPDF(est)}
                          >
                            <Download className="h-3.5 w-3.5 mr-2" /> Export PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => duplicateEstimate.mutate(est)}
                          >
                            <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteEstimate.mutate(est.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </motion.div>
      )}

      <EstimateBuilderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editId={editId}
      />

      {/* Confirm approve/decline */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "approved"
                ? "Approve this estimate?"
                : "Decline this estimate?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "approved"
                ? `Mark ${confirmAction.est.estimate_number} as approved${wonStage ? ` and move contact to "${wonStage.name}"` : ""}.`
                : `Mark ${confirmAction?.est?.estimate_number} as declined${lostStage ? ` and move contact to "${lostStage.name}"` : ""}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedAction}
              className={
                confirmAction?.action === "declined"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {confirmAction?.action === "approved" ? "Approve" : "Decline"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to Job dialog */}
      <Dialog open={!!convertDialog} onOpenChange={() => setConvertDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Convert to Job</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Schedule a job from estimate {convertDialog?.estimate_number}.
          </p>
          <div className="space-y-3 pt-2">
            <div>
              <Label>Job Date</Label>
              <Input
                type="date"
                value={convertDate}
                onChange={(e) => setConvertDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={convertTime}
                onChange={(e) => setConvertTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConvertDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConvertToJob}
              disabled={!convertDate || convertToJob.isPending}
            >
              {convertToJob.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Schedule Job
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
