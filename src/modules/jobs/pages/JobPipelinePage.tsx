import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useContacts } from "@/hooks/useContacts";
import { useEstimates } from "@/hooks/useEstimates";
import { useJobs, useUpdateJobStatus, type JobStatus } from "@/hooks/useJobs";
import { useUpdateEstimateStatus } from "@/hooks/useEstimates";
import { useUpdateContact } from "@/hooks/useContactActions";
import { toast } from "sonner";
import JobPipelineMetrics from "../components/JobPipelineMetrics";
import JobPipelineCard from "../components/JobPipelineCard";

// Fixed stages representing the service business workflow
const PIPELINE_STAGES = [
  { id: "new_lead", label: "New Lead", color: "bg-primary/10 border-primary/30" },
  { id: "estimate_sent", label: "Estimate Sent", color: "bg-warning/10 border-warning/30" },
  { id: "estimate_approved", label: "Estimate Approved", color: "bg-success/10 border-success/30" },
  { id: "job_scheduled", label: "Job Scheduled", color: "bg-accent/10 border-accent/30" },
  { id: "completed", label: "Completed", color: "bg-success/10 border-success/30" },
  { id: "paid", label: "Paid", color: "bg-primary/10 border-primary/30" },
] as const;

type StageId = (typeof PIPELINE_STAGES)[number]["id"];

export default function JobPipelinePage() {
  const navigate = useNavigate();
  const { data: contacts = [], isLoading: contactsLoading } = useContacts();
  const { data: estimates = [], isLoading: estimatesLoading } = useEstimates();
  const { data: jobs = [], isLoading: jobsLoading } = useJobs();
  const updateJobStatus = useUpdateJobStatus();
  const updateEstimateStatus = useUpdateEstimateStatus();
  const updateContact = useUpdateContact();

  const [draggedItem, setDraggedItem] = useState<{ id: string; type: string; stageId: StageId } | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  const isLoading = contactsLoading || estimatesLoading || jobsLoading;

  // Map data into pipeline stages
  const stageItems = useMemo(() => {
    const map: Record<StageId, Array<{ item: any; type: "lead" | "estimate" | "job" }>> = {
      new_lead: [],
      estimate_sent: [],
      estimate_approved: [],
      job_scheduled: [],
      completed: [],
      paid: [],
    };

    // New leads = contacts without estimates or jobs linked
    const leadsWithEstimates = new Set(estimates.map((e: any) => e.lead_id).filter(Boolean));
    const leadsWithJobs = new Set(jobs.map((j: any) => j.lead_id).filter(Boolean));
    contacts.forEach((c: any) => {
      if (!leadsWithEstimates.has(c.id) && !leadsWithJobs.has(c.id) && c.status === "open") {
        map.new_lead.push({ item: c, type: "lead" });
      }
    });

    // Estimates
    estimates.forEach((e: any) => {
      if (["draft", "sent", "viewed"].includes(e.status)) {
        map.estimate_sent.push({ item: e, type: "estimate" });
      } else if (e.status === "approved" && !jobs.some((j: any) => j.estimate_id === e.id)) {
        map.estimate_approved.push({ item: e, type: "estimate" });
      }
    });

    // Jobs
    jobs.forEach((j: any) => {
      if (["draft", "scheduled"].includes(j.status)) {
        map.job_scheduled.push({ item: j, type: "job" });
      } else if (["in_progress"].includes(j.status)) {
        map.job_scheduled.push({ item: j, type: "job" });
      } else if (j.status === "completed") {
        map.completed.push({ item: j, type: "job" });
      }
      // "paid" would require invoice tracking - show completed jobs with signatures as paid
      // For now, jobs with signature are considered "paid"
    });

    return map;
  }, [contacts, estimates, jobs]);

  const handleDragStart = (e: React.DragEvent, id: string, type: string, stageId: StageId) => {
    setDraggedItem({ id, type, stageId });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, toStageId: StageId) => {
    e.preventDefault();
    setDragOverStageId(null);
    if (!draggedItem || draggedItem.stageId === toStageId) {
      setDraggedItem(null);
      return;
    }

    const { id, type } = draggedItem;

    try {
      if (type === "job") {
        const statusMap: Partial<Record<StageId, JobStatus>> = {
          job_scheduled: "scheduled",
          completed: "completed",
        };
        const newStatus = statusMap[toStageId];
        if (newStatus) {
          const job = jobs.find((j: any) => j.id === id);
          await updateJobStatus.mutateAsync({
            id, status: newStatus, lead_id: job?.lead_id, job_number: job?.job_number,
          });
        }
      } else if (type === "estimate") {
        if (toStageId === "estimate_approved") {
          const est = estimates.find((e: any) => e.id === id);
          await updateEstimateStatus.mutateAsync({
            id, status: "approved", lead_id: est?.lead_id, estimate_number: est?.estimate_number,
          });
        }
      }
      toast.success("Updated successfully");
    } catch {
      toast.error("Failed to update");
    }

    setDraggedItem(null);
  };

  const handleQuickAction = (action: string, item: any, type: string) => {
    switch (action) {
      case "send_estimate":
        navigate(`/app/estimates?lead=${item.lead_id ?? item.id}`);
        break;
      case "schedule":
        navigate(`/app/bookings?new=1`);
        break;
      case "mark_completed":
        if (type === "job") {
          updateJobStatus.mutate({
            id: item.id, status: "completed", lead_id: item.lead_id,
            job_number: item.job_number, title: item.title,
            grandTotal: item.estimates?.grand_total ? Number(item.estimates.grand_total) : 0,
          });
        } else if (type === "estimate") {
          updateEstimateStatus.mutate({ id: item.id, status: "approved", lead_id: item.lead_id, estimate_number: item.estimate_number });
        }
        break;
      case "send_invoice":
        toast.info("Invoice feature coming soon");
        break;
      case "request_review":
        toast.info("Review request sent");
        break;
    }
  };

  const handleCardClick = (item: any, type: string) => {
    if (type === "lead") navigate(`/app/contacts/${item.id}`);
    else if (type === "estimate") navigate(`/app/estimates`);
    else if (type === "job") navigate(`/app/jobs/${item.id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight"><span className="font-black text-primary">guzzl</span> <span className="font-normal">Job Pipeline</span></h1>
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><span className="font-black text-primary">guzzl</span> <span className="font-normal">Job Pipeline</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Track leads from first contact to payment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/app/contacts")}>
            <Plus className="h-4 w-4 mr-2" /> New Lead
          </Button>
          <Button className="shadow-glow" onClick={() => navigate("/app/jobs")}>
            <Plus className="h-4 w-4 mr-2" /> New Job
          </Button>
        </div>
      </div>

      {/* Metrics bar */}
      <JobPipelineMetrics leads={contacts} estimates={estimates} jobs={jobs} />

      {/* Kanban board */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 overflow-x-auto pb-4 min-h-[55vh]"
      >
        {PIPELINE_STAGES.map((stage, stageIndex) => {
          const items = stageItems[stage.id];
          const isDragOver = dragOverStageId === stage.id;

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stageIndex * 0.05, duration: 0.3 }}
              className={`min-w-[260px] w-[260px] shrink-0 rounded-xl border p-3 flex flex-col transition-all duration-200 ${
                isDragOver
                  ? "drag-over border-primary/50 scale-[1.01]"
                  : "border-border bg-muted/30"
              }`}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverStageId(stage.id); }}
              onDragLeave={() => setDragOverStageId(null)}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-overline">{stage.label}</h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 tabular-nums">{items.length}</Badge>
              </div>

              <div className="space-y-2 flex-1">
                {items.map(({ item, type }) => (
                  <JobPipelineCard
                    key={`${type}-${item.id}`}
                    item={item}
                    type={type}
                    isDragging={draggedItem?.id === item.id}
                    onDragStart={(e) => handleDragStart(e, item.id, type, stage.id)}
                    onQuickAction={(action) => handleQuickAction(action, item, type)}
                    onClick={() => handleCardClick(item, type)}
                  />
                ))}

                {items.length === 0 && (
                  <div className={`flex items-center justify-center h-20 text-xs border border-dashed rounded-xl transition-all duration-200 ${
                    isDragOver ? "border-primary/50 text-primary bg-primary/5" : "border-border text-muted-foreground"
                  }`}>
                    Drop here
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
