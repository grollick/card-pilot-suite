import { useMemo } from "react";
import { FileText, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { useEstimates } from "@/hooks/useEstimates";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function EstimateMetrics() {
  const { data: estimates = [] } = useEstimates();

  const stats = useMemo(() => {
    const sent = estimates.filter((e: any) => ["sent", "viewed", "approved", "declined"].includes(e.status));
    const approved = estimates.filter((e: any) => e.status === "approved");
    const declined = estimates.filter((e: any) => e.status === "declined");
    const approvalRate = sent.length > 0 ? Math.round((approved.length / sent.length) * 100) : 0;
    const avgValue = estimates.length > 0
      ? estimates.reduce((sum: number, e: any) => sum + Number(e.grand_total || 0), 0) / estimates.length
      : 0;
    const totalApproved = approved.reduce((sum: number, e: any) => sum + Number(e.grand_total || 0), 0);
    const totalLost = declined.reduce((sum: number, e: any) => sum + Number(e.grand_total || 0), 0);

    return { sent: sent.length, approved: approved.length, declined: declined.length, approvalRate, avgValue, totalApproved, totalLost };
  }, [estimates]);

  const chartData = useMemo(() => {
    const months: { month: string; sent: number; approved: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const label = format(d, "MMM");
      const inRange = estimates.filter((e: any) => {
        const created = new Date(e.created_at);
        return isWithinInterval(created, { start, end });
      });
      months.push({
        month: label,
        sent: inRange.filter((e: any) => ["sent", "viewed", "approved", "declined"].includes(e.status)).length,
        approved: inRange.filter((e: any) => e.status === "approved").length,
      });
    }
    return months;
  }, [estimates]);

  if (estimates.length === 0) return null;

  return (
    <div className="dash-card p-5">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" /> Estimate Performance
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold tabular-nums">{stats.sent}</div>
          <div className="text-[11px] text-muted-foreground">Sent</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold tabular-nums text-emerald-600">{stats.approvalRate}%</div>
          <div className="text-[11px] text-muted-foreground">Approval Rate</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold tabular-nums">${(stats.avgValue).toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
          <div className="text-[11px] text-muted-foreground">Avg Value</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold tabular-nums text-emerald-600">${stats.totalApproved.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
          <div className="text-[11px] text-muted-foreground">Won Value</div>
        </div>
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
            />
            <Bar dataKey="sent" fill="hsl(var(--primary) / 0.3)" radius={[4, 4, 0, 0]} name="Sent" />
            <Bar dataKey="approved" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Approved" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
