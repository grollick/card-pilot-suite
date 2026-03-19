import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, FileText, Send, Eye, CheckCircle, AlertTriangle, X, MoreHorizontal, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  useInvoices, useUpdateInvoiceStatus, useDeleteInvoice,
  INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS, type InvoiceStatus,
} from "@/hooks/useInvoices";
import { format } from "date-fns";

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
  const { data: invoices = [], isLoading } = useInvoices(statusFilter);
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();

  const totalRevenue = invoices.filter((i: any) => i.status === "paid").reduce((sum: number, i: any) => sum + Number(i.grand_total), 0);
  const totalOutstanding = invoices.filter((i: any) => ["sent", "viewed", "overdue"].includes(i.status)).reduce((sum: number, i: any) => sum + Number(i.grand_total), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage billing and track payments</p>
        </div>
        <Button className="shadow-glow" onClick={() => navigate("/app/invoices/new")}>
          <Plus className="h-4 w-4 mr-2" /> New Invoice
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total Invoices</p>
          <p className="text-2xl font-bold">{invoices.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-success">${totalRevenue.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-warning">${totalOutstanding.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold text-destructive">
            {invoices.filter((i: any) => i.status === "overdue").length}
          </p>
        </CardContent></Card>
      </div>

      {/* Status filter tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="flex-wrap">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs gap-1">
              <tab.icon className="h-3 w-3" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold">No invoices yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Create your first invoice or complete a job to auto-generate one.</p>
            <Button className="mt-4" onClick={() => navigate("/app/invoices/new")}>
              <Plus className="h-4 w-4 mr-2" /> Create Invoice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv: any) => (
            <Card
              key={inv.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/app/invoices/${inv.id}`)}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold">{inv.invoice_number}</span>
                    <Badge className={`text-[10px] ${INVOICE_STATUS_COLORS[inv.status as InvoiceStatus]}`}>
                      {INVOICE_STATUS_LABELS[inv.status as InvoiceStatus]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {inv.leads?.name || "No customer"} {inv.jobs?.title ? `• ${inv.jobs.title}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold">${Number(inv.grand_total).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.due_date ? `Due ${format(new Date(inv.due_date), "MMM d")}` : "No due date"}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    {inv.status === "draft" && (
                      <DropdownMenuItem onClick={() => updateStatus.mutate({ id: inv.id, status: "sent" })}>
                        <Send className="h-4 w-4 mr-2" /> Mark as Sent
                      </DropdownMenuItem>
                    )}
                    {["sent", "viewed", "overdue"].includes(inv.status) && (
                      <DropdownMenuItem onClick={() => updateStatus.mutate({ id: inv.id, status: "paid" })}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Mark as Paid
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteInvoice.mutate(inv.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
