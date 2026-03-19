import { useMemo } from "react";
import { FileText, Receipt, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { useEstimates } from "@/hooks/useEstimates";
import { useInvoices } from "@/hooks/useInvoices";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function RevenuePipelineWidget() {
  const { data: estimates = [] } = useEstimates();
  const { data: invoices = [] } = useInvoices();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const pendingEstimates = estimates.filter((e: any) => ["draft", "sent", "viewed"].includes(e.status));
    const approvedEstimates = estimates.filter((e: any) => e.status === "approved");
    const unpaidInvoices = invoices.filter((i: any) => ["sent", "viewed"].includes(i.status));
    const overdueInvoices = invoices.filter((i: any) => i.status === "overdue");
    const paidInvoices = invoices.filter((i: any) => i.status === "paid");

    const pendingValue = pendingEstimates.reduce((s: number, e: any) => s + Number(e.grand_total || 0), 0);
    const approvedValue = approvedEstimates.reduce((s: number, e: any) => s + Number(e.grand_total || 0), 0);
    const unpaidValue = unpaidInvoices.reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0);
    const overdueValue = overdueInvoices.reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0);
    const paidValue = paidInvoices.reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0);

    const totalEstimated = estimates.reduce((s: number, e: any) => s + Number(e.grand_total || 0), 0);
    const totalInvoiced = invoices.reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0);
    const conversionRate = totalEstimated > 0 ? Math.round((totalInvoiced / totalEstimated) * 100) : 0;

    return {
      pendingEstimates: pendingEstimates.length, pendingValue,
      approvedEstimates: approvedEstimates.length, approvedValue,
      unpaidInvoices: unpaidInvoices.length, unpaidValue,
      overdueInvoices: overdueInvoices.length, overdueValue,
      paidValue, conversionRate,
    };
  }, [estimates, invoices]);

  if (estimates.length === 0 && invoices.length === 0) return null;

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  const stages = [
    {
      label: "Pending Quotes",
      count: stats.pendingEstimates,
      value: stats.pendingValue,
      icon: FileText,
      color: "text-primary",
      bg: "bg-primary/10",
      onClick: () => navigate("/app/estimates"),
    },
    {
      label: "Approved",
      count: stats.approvedEstimates,
      value: stats.approvedValue,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
      onClick: () => navigate("/app/estimates"),
    },
    {
      label: "Unpaid Invoices",
      count: stats.unpaidInvoices,
      value: stats.unpaidValue,
      icon: Receipt,
      color: "text-[hsl(var(--warning))]",
      bg: "bg-[hsl(var(--warning))]/10",
      onClick: () => navigate("/app/invoices"),
    },
    {
      label: "Overdue",
      count: stats.overdueInvoices,
      value: stats.overdueValue,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      onClick: () => navigate("/app/invoices"),
    },
  ];

  return (
    <div className="dash-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" /> Revenue Pipeline
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Collected: <strong className="text-emerald-600">{fmt(stats.paidValue)}</strong></span>
          <span>Conv: <strong className="text-foreground">{stats.conversionRate}%</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stages.map((stage) => (
          <button
            key={stage.label}
            onClick={stage.onClick}
            className={`${stage.bg} rounded-xl p-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98]`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <stage.icon className={`h-3.5 w-3.5 ${stage.color}`} />
              <span className="text-[11px] font-medium text-muted-foreground">{stage.label}</span>
            </div>
            <p className={`text-lg font-bold tabular-nums ${stage.color}`}>{fmt(stage.value)}</p>
            <p className="text-[11px] text-muted-foreground">{stage.count} item{stage.count !== 1 ? "s" : ""}</p>
          </button>
        ))}
      </div>

      {/* Visual flow arrows */}
      <div className="flex items-center justify-center gap-1 mt-3 text-muted-foreground/40">
        <span className="text-[10px]">Quote</span>
        <ArrowRight className="h-3 w-3" />
        <span className="text-[10px]">Approve</span>
        <ArrowRight className="h-3 w-3" />
        <span className="text-[10px]">Invoice</span>
        <ArrowRight className="h-3 w-3" />
        <span className="text-[10px]">Paid</span>
      </div>
    </div>
  );
}