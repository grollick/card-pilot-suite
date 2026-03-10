import { DollarSign, Users, FileText, Briefcase, CheckCircle2, CreditCard } from "lucide-react";

interface Props {
  leads: any[];
  estimates: any[];
  jobs: any[];
}

export default function JobPipelineMetrics({ leads, estimates, jobs }: Props) {
  const newLeads = leads.filter((l) => !l.stage_id || l.lifecycle_stage === "lead").length;
  const pendingEstimates = estimates.filter((e) => ["sent", "viewed"].includes(e.status)).length;
  const scheduledJobs = jobs.filter((j) => j.status === "scheduled").length;
  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const revenue = jobs
    .filter((j) => j.status === "completed")
    .reduce((s, j) => s + Number(j.estimates?.grand_total || 0), 0);

  const metrics = [
    { label: "New Leads", value: newLeads, icon: Users, color: "text-primary" },
    { label: "Pending Estimates", value: pendingEstimates, icon: FileText, color: "text-warning" },
    { label: "Scheduled", value: scheduledJobs, icon: Briefcase, color: "text-accent-foreground" },
    { label: "Completed", value: completedJobs, icon: CheckCircle2, color: "text-success" },
    { label: "Revenue", value: `$${revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, icon: DollarSign, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {metrics.map((m) => (
        <div key={m.label} className="dash-card p-4 flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center ${m.color}`}>
            <m.icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums leading-tight">{m.value}</p>
            <p className="text-[11px] text-muted-foreground">{m.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
