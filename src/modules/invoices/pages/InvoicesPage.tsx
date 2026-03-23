import { useState } from "react";
import DesktopGuidanceNotice from "@/components/DesktopGuidanceNotice";
import { useNavigate } from "react-router-dom";
import {
  Plus, Loader2, FileText, Send, Eye, CheckCircle, AlertTriangle,
  MoreHorizontal, Trash2, Download, Search, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useInvoices, useUpdateInvoiceStatus, useDeleteInvoice, type InvoiceStatus,
} from "@/hooks/useInvoices";
import { format } from "date-fns";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { exportInvoicePDF } from "@/lib/invoicePdf";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import DocumentStatusBadge from "@/components/DocumentStatusBadge";
import UpgradePrompt from "@/components/UpgradePrompt";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";

const STATUS_TABS: Array<{ value: string; label: string; icon: any }> = [
  { value: "all", label: "All", icon: FileText },
  { value: "draft", label: "Drafts", icon: FileText },
  { value: "sent", label: "Sent", icon: Send },
  { value: "viewed", label: "Viewed", icon: Eye },
  { value: "paid", label: "Paid", icon: CheckCircle },
  { value: "overdue", label: "Overdue", icon: AlertTriangle },
];

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { data: invoices = [], isLoading } = useInvoices(statusFilter);
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();
  const { planKey, profile, checkLimit, hasFeature } = usePlanLimits();

  const isFree = planKey === "starter";
  const thisMonthInvoices = invoices.filter((i: any) => {
    const d = new Date(i.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const invoiceLimitReached = isFree && thisMonthInvoices.length >= 3;

  const handleExportPDF = async (inv: any) => {
    const { data: lineItems } = await supabase
      .from("invoice_line_items")
      .select("*")
      .eq("invoice_id", inv.id)
      .order("sort_order");
    exportInvoicePDF({
      invoice: { ...inv, leads: inv.leads, jobs: inv.jobs },
      lineItems: (lineItems ?? []) as any[],
      profile: profile as any,
      planKey,
    });
  };

  const filtered = invoices.filter((inv: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (inv.leads?.name?.toLowerCase() ?? "").includes(s) ||
      (inv.invoice_number?.toLowerCase() ?? "").includes(s)
    );
  });

  const totalRevenue = invoices
    .filter((i: any) => i.status === "paid")
    .reduce((sum: number, i: any) => sum + Number(i.grand_total), 0);
  const totalOutstanding = invoices
    .filter((i: any) => ["sent", "viewed", "overdue"].includes(i.status))
    .reduce((sum: number, i: any) => sum + Number(i.grand_total), 0);
  const overdueCount = invoices.filter((i: any) => i.status === "overdue").length;

  return (
    <div className="space-y-5">
      <DesktopGuidanceNotice toolKey="invoice-builder" />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><span className="font-black text-primary text-4xl">guzzl</span> <span className="font-normal text-muted-foreground">Invoices</span></h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage billing and track payments
          </p>
        </div>
        <Button
          className="shadow-glow"
          onClick={() => {
            if (invoiceLimitReached) {
              setShowUpgrade(true);
            } else {
              navigate("/app/invoices/new");
            }
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> New Invoice
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <div className="dash-card p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Total
          </p>
          <p className="text-2xl font-bold tabular-nums mt-1">
            {invoices.length}
          </p>
        </div>
        <div className="dash-card p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Paid
          </p>
          <p className="text-2xl font-bold tabular-nums text-success mt-1">
            ${totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="dash-card p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Outstanding
          </p>
          <p className="text-2xl font-bold tabular-nums text-warning mt-1">
            ${totalOutstanding.toLocaleString()}
          </p>
        </div>
        <div className="dash-card p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Overdue
          </p>
          <p className="text-2xl font-bold tabular-nums text-destructive mt-1">
            {overdueCount}
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="flex-wrap">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs gap-1"
              >
                <tab.icon className="h-3 w-3" /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* List */}
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
          <h3 className="font-semibold mb-1">No invoices yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first invoice to start billing customers.
          </p>
          <Button onClick={() => navigate("/app/invoices/new")}>
            <Plus className="h-4 w-4 mr-2" /> Create Invoice
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {filtered.map((inv: any, idx: number) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="dash-card p-4 flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-all group"
              onClick={() => navigate(`/app/invoices/${inv.id}`)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                  <DollarSign className="h-4.5 w-4.5 text-primary/60" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold">
                      {inv.invoice_number}
                    </span>
                    <DocumentStatusBadge status={inv.status} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {inv.leads?.name || "No customer"}
                    {inv.jobs?.title ? ` • ${inv.jobs.title}` : ""}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold tabular-nums">
                  ${Number(inv.grand_total).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {inv.due_date
                    ? `Due ${format(new Date(inv.due_date + "T00:00:00"), "MMM d")}`
                    : "No due date"}
                </p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {inv.status === "draft" && (
                      <DropdownMenuItem
                        onClick={() =>
                          updateStatus.mutate({
                            id: inv.id,
                            status: "sent",
                            lead_id: inv.lead_id,
                            invoice_number: inv.invoice_number,
                          })
                        }
                      >
                        <Send className="h-4 w-4 mr-2" /> Mark as Sent
                      </DropdownMenuItem>
                    )}
                    {["sent", "viewed", "overdue"].includes(inv.status) && (
                      <DropdownMenuItem
                        onClick={() =>
                          updateStatus.mutate({
                            id: inv.id,
                            status: "paid",
                            lead_id: inv.lead_id,
                            invoice_number: inv.invoice_number,
                          })
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Mark as Paid
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleExportPDF(inv)}>
                      <Download className="h-4 w-4 mr-2" /> Export PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteInvoice.mutate(inv.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {/* Limit banner for free users */}
      {isFree && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Alert className={invoiceLimitReached ? "border-destructive/30 bg-destructive/5" : "border-primary/20 bg-primary/5"}>
            <Sparkles className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {invoiceLimitReached
                ? `You've used all 3 invoices this month. Upgrade to Pro for unlimited invoices, PDF export, and more.`
                : `${thisMonthInvoices.length}/3 invoices used this month on Free plan.`}
              {invoiceLimitReached && (
                <Button
                  variant="link"
                  className="h-auto p-0 ml-1"
                  onClick={() => setShowUpgrade(true)}
                >
                  Upgrade now →
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <UpgradePrompt
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        feature="invoice"
        currentPlan={planKey}
      />
    </div>
  );
}
