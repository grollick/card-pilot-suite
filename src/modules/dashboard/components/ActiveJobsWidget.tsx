import { useNavigate } from "react-router-dom";
import { Briefcase, ArrowUpRight, StickyNote, Camera, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useJobs, JOB_STATUS_LABELS, JOB_STATUS_COLORS, type JobStatus, useUpdateJobStatus } from "@/hooks/useJobs";
import { format } from "date-fns";

export default function ActiveJobsWidget() {
  const navigate = useNavigate();
  const { data: allJobs = [], isLoading } = useJobs();
  const updateStatus = useUpdateJobStatus();

  const activeJobs = allJobs
    .filter((j: any) => ["scheduled", "in_progress"].includes(j.status))
    .sort((a: any, b: any) => {
      if (a.status === "in_progress" && b.status !== "in_progress") return -1;
      if (b.status === "in_progress" && a.status !== "in_progress") return 1;
      return new Date(a.scheduled_start || a.created_at).getTime() - new Date(b.scheduled_start || b.created_at).getTime();
    })
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <Briefcase className="h-4 w-4 text-warning" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Active Jobs</h2>
            <p className="text-2xs text-muted-foreground">{activeJobs.length} in progress or scheduled</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/app/jobs")}>
          View all <ArrowUpRight className="h-3 w-3" />
        </Button>
      </div>

      <div className="dash-card-body">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : activeJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No active jobs</p>
        ) : (
          <div className="space-y-1">
            {activeJobs.map((job: any) => (
              <div
                key={job.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors group cursor-pointer"
                onClick={() => navigate(`/app/jobs/${job.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{job.title}</p>
                  <p className="text-2xs text-muted-foreground truncate">
                    {job.leads?.name ?? "No customer"}
                    {job.scheduled_start && ` · ${format(new Date(job.scheduled_start), "MMM d")}`}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Add note"
                    onClick={(e) => { e.stopPropagation(); navigate(`/app/jobs/${job.id}`); }}>
                    <StickyNote className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Mark complete"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus.mutate({ id: job.id, status: "completed", lead_id: job.lead_id, job_number: job.job_number });
                    }}>
                    <CheckCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Badge className={`text-2xs capitalize shrink-0 ${JOB_STATUS_COLORS[job.status as JobStatus]}`}>
                  {JOB_STATUS_LABELS[job.status as JobStatus]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
