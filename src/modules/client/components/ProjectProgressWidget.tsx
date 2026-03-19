import { motion } from "framer-motion";
import { Briefcase, CheckCircle2, Clock, Wrench, CircleDot } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface Props {
  leadIds: string[];
}

const STAGES = [
  { key: "estimate_sent", label: "Estimate", icon: CircleDot },
  { key: "scheduled", label: "Scheduled", icon: Clock },
  { key: "in_progress", label: "In Progress", icon: Wrench },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
];

function getStageIndex(status: string): number {
  if (["draft", "sent", "viewed"].includes(status)) return 0;
  if (["scheduled"].includes(status)) return 1;
  if (["in_progress", "paused"].includes(status)) return 2;
  if (["completed", "paid"].includes(status)) return 3;
  return -1;
}

export default function ProjectProgressWidget({ leadIds }: Props) {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["client-jobs-progress", leadIds],
    enabled: leadIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, title, status, scheduled_date, completed_at, created_at")
        .in("lead_id", leadIds)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  if (isLoading) return <Skeleton className="h-40 rounded-xl" />;
  if (!jobs?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-5 space-y-4"
    >
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-primary" />
        Project Progress
      </h3>

      <div className="space-y-4">
        {jobs.map((job) => {
          const currentStage = getStageIndex(job.status);
          return (
            <div key={job.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">{job.title || "Job"}</p>
                <span className="text-2xs text-muted-foreground">
                  {job.scheduled_date ? format(new Date(job.scheduled_date), "MMM d") : ""}
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-1">
                {STAGES.map((stage, i) => {
                  const isActive = i <= currentStage;
                  const isCurrent = i === currentStage;
                  return (
                    <div key={stage.key} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`h-1.5 w-full rounded-full transition-colors ${
                          isActive ? "bg-primary" : "bg-muted"
                        }`}
                      />
                      <div className="flex items-center gap-0.5">
                        <stage.icon className={`h-2.5 w-2.5 ${
                          isCurrent ? "text-primary" : isActive ? "text-primary/60" : "text-muted-foreground/40"
                        }`} />
                        <span className={`text-[9px] ${
                          isCurrent ? "text-primary font-semibold" : "text-muted-foreground/60"
                        }`}>
                          {stage.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
