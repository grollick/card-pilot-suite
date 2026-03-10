import { Briefcase, CheckCircle2, DollarSign, TrendingUp } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";

export default function JobMetrics() {
  const { data: jobs = [] } = useJobs();
  if (jobs.length === 0) return null;

  const active = jobs.filter((j: any) => ["scheduled", "in_progress"].includes(j.status)).length;
  const completed = jobs.filter((j: any) => j.status === "completed").length;
  const revenue = jobs.filter((j: any) => j.status === "completed").reduce((s: number, j: any) => s + Number(j.estimates?.grand_total || 0), 0);
  const avgValue = jobs.length > 0 ? jobs.reduce((s: number, j: any) => s + Number(j.estimates?.grand_total || 0), 0) / jobs.length : 0;

  return (
    <div className="dash-card p-5">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-primary" /> Job Overview
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center">
          <div className="text-lg font-bold tabular-nums">{active}</div>
          <div className="text-[11px] text-muted-foreground">Active</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold tabular-nums text-success">{completed}</div>
          <div className="text-[11px] text-muted-foreground">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold tabular-nums">${revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
          <div className="text-[11px] text-muted-foreground">Revenue</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold tabular-nums">${avgValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
          <div className="text-[11px] text-muted-foreground">Avg Value</div>
        </div>
      </div>
    </div>
  );
}
