import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Camera, Clock, FileText, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface JobSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any;
  tasks: any[];
  photos: any[];
  materials: any[];
}

export default function JobSummaryDialog({ open, onOpenChange, job, tasks, photos, materials }: JobSummaryDialogProps) {
  if (!job) return null;

  const completedTasks = tasks.filter((t: any) => t.status === "completed");
  const materialTotal = materials.reduce((s: number, m: any) => s + (Number(m.quantity) * Number(m.unit_cost)), 0);

  const duration = job.actual_start && job.actual_end
    ? Math.round((new Date(job.actual_end).getTime() - new Date(job.actual_start).getTime()) / 60000)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Job Completed
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Job Info */}
          <div className="space-y-1">
            <h3 className="font-semibold">{job.title}</h3>
            <p className="text-sm text-muted-foreground">{job.job_number}</p>
            {job.leads?.name && <p className="text-sm">Customer: <span className="font-medium">{job.leads.name}</span></p>}
            {job.job_address && <p className="text-sm text-muted-foreground">{job.job_address}</p>}
          </div>

          {/* Duration */}
          {duration !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Duration: <span className="font-medium">{duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : `${duration}m`}</span></span>
            </div>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Tasks ({completedTasks.length}/{tasks.length})</p>
              <div className="space-y-1">
                {tasks.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${t.status === "completed" ? "text-success" : "text-muted-foreground"}`} />
                    <span className={t.status === "completed" ? "" : "text-muted-foreground"}>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Photos ({photos.length})</p>
              <div className="grid grid-cols-4 gap-1.5">
                {photos.slice(0, 8).map((p: any) => (
                  <div key={p.id} className="aspect-square rounded-lg overflow-hidden border border-border">
                    <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materials */}
          {materials.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Materials ({materials.length} items)</span>
              <span className="font-semibold tabular-nums">${materialTotal.toFixed(2)}</span>
            </div>
          )}

          {/* Signature */}
          {job.signature_url && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Customer Signature</p>
              <div className="border border-border rounded-lg p-3 bg-card">
                <img src={job.signature_url} alt="Signature" className="h-16 object-contain" />
                {job.signature_name && <p className="text-xs text-muted-foreground mt-1">{job.signature_name}</p>}
                {job.signed_at && <p className="text-[10px] text-muted-foreground">{format(new Date(job.signed_at), "MMM d, yyyy h:mm a")}</p>}
              </div>
            </div>
          )}

          {/* Completion */}
          {job.actual_end && (
            <p className="text-xs text-muted-foreground text-center">
              Completed {format(new Date(job.actual_end), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={() => { toast.info("PDF export coming soon"); }}>
              <FileText className="h-4 w-4" /> Save PDF
            </Button>
            <Button className="flex-1 gap-1.5" onClick={() => { toast.info("Email summary coming soon"); }}>
              <Send className="h-4 w-4" /> Send to Customer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
