import { useNavigate } from "react-router-dom";
import {
  Briefcase, Camera, FileText, UserPlus, Sparkles,
  ChevronRight, Clock, AlertTriangle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { useJobs, JOB_STATUS_LABELS, JOB_STATUS_COLORS, type JobStatus } from "@/hooks/useJobs";
import { useTasks } from "@/hooks/useTasks";
import { motion } from "framer-motion";

export default function MobileJobDashboard() {
  const navigate = useNavigate();
  const { data: jobs = [], isLoading } = useJobs();
  const { data: allTasks = [] } = useTasks({ status: "open" });

  const today = new Date().toISOString().split("T")[0];

  const todaysJobs = jobs.filter((j: any) => {
    if (!j.scheduled_start) return j.status === "in_progress";
    return isToday(new Date(j.scheduled_start)) || j.status === "in_progress";
  });

  const upcomingJobs = jobs
    .filter((j: any) => j.scheduled_start && !isToday(new Date(j.scheduled_start)) && ["scheduled"].includes(j.status))
    .sort((a: any, b: any) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
    .slice(0, 5);

  const overdueTasks = allTasks.filter((t: any) => t.due_date && t.due_date < today);

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Briefcase, label: "Jobs", onClick: () => navigate("/app/jobs"), color: "text-primary" },
          { icon: Camera, label: "Photo", onClick: () => navigate("/app/jobs"), color: "text-accent" },
          { icon: FileText, label: "Estimate", onClick: () => navigate("/app/estimates"), color: "text-warning" },
          { icon: UserPlus, label: "Contact", onClick: () => navigate("/app/contacts"), color: "text-success" },
        ].map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="flex-col h-20 gap-1.5 text-xs font-medium"
            onClick={action.onClick}
          >
            <action.icon className={`h-6 w-6 ${action.color}`} />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="dash-card p-3 border-destructive/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive">Overdue Tasks ({overdueTasks.length})</span>
          </div>
          {overdueTasks.slice(0, 3).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between py-1.5 text-sm">
              <span className="truncate flex-1">{t.title}</span>
              <span className="text-xs text-destructive ml-2">{t.due_date && format(new Date(t.due_date + "T00:00:00"), "MMM d")}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Today's Jobs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm">Today's Jobs</h2>
          <Badge variant="secondary" className="text-xs">{todaysJobs.length}</Badge>
        </div>
        {todaysJobs.length === 0 ? (
          <div className="dash-card p-6 text-center">
            <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No jobs scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todaysJobs.map((job: any) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="dash-card p-4 active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => navigate(`/app/jobs/${job.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{job.leads?.name ?? "No customer"}</p>
                    {job.job_address && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{job.job_address}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge className={`capitalize text-[10px] ${JOB_STATUS_COLORS[job.status as JobStatus]}`}>
                      {JOB_STATUS_LABELS[job.status as JobStatus]}
                    </Badge>
                    {job.scheduled_start && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {format(new Date(job.scheduled_start), "h:mm a")}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 hidden" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Jobs */}
      {upcomingJobs.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm mb-2">Upcoming</h2>
          <div className="space-y-1.5">
            {upcomingJobs.map((job: any) => (
              <div
                key={job.id}
                className="dash-card p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => navigate(`/app/jobs/${job.id}`)}
              >
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.leads?.name ?? "No customer"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium">
                    {isTomorrow(new Date(job.scheduled_start)) ? "Tomorrow" : format(new Date(job.scheduled_start), "MMM d")}
                  </p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">{format(new Date(job.scheduled_start), "h:mm a")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
