import { useState, useRef } from "react";
import GuzzlLogo from "@/components/brand/GuzzlLogo";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, Camera, MapPin, Phone, MessageSquare, CheckCircle2,
  Clock, Play, Pause, ChevronRight, Loader2, AlertTriangle,
  Navigation, Sparkles, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format, isToday, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useMyAssignedJobs, useNotifications } from "@/hooks/useTeam";
import { useUpdateJobStatus, useUpdateJob, useUploadJobPhoto, JOB_STATUS_LABELS, JOB_STATUS_COLORS, type JobStatus } from "@/hooks/useJobs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function TechDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: jobs = [], isLoading } = useMyAssignedJobs();
  const { data: notifications = [], markRead, markAllRead } = useNotifications();
  const updateStatus = useUpdateJobStatus();
  const updateJob = useUpdateJob();
  const uploadPhoto = useUploadJobPhoto();
  const cameraRef = useRef<HTMLInputElement>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [quickNote, setQuickNote] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);

  const todaysJobs = jobs.filter((j: any) => {
    if (j.status === "in_progress") return true;
    if (!j.scheduled_start) return false;
    return isToday(new Date(j.scheduled_start));
  });

  const upcomingJobs = jobs.filter((j: any) => {
    if (!j.scheduled_start) return false;
    return !isToday(new Date(j.scheduled_start)) && j.status === "scheduled";
  });

  const unreadCount = notifications.filter((n: any) => !n.read_at).length;

  const handleStatusChange = (job: any, nextStatus: JobStatus) => {
    updateStatus.mutate({
      id: job.id,
      status: nextStatus,
      lead_id: job.lead_id,
      job_number: job.job_number,
    });
  };

  const handleQuickNote = (jobId: string, existingNotes: string) => {
    if (!quickNote.trim()) return;
    const stamp = format(new Date(), "MMM d, h:mm a");
    const updated = `${existingNotes || ""}\n\n[${stamp}] ${quickNote}`.trim();
    updateJob.mutate({ id: jobId, notes: updated });
    setQuickNote("");
    toast.success("Note added");
  };

  const handleCameraCapture = (jobId: string) => {
    setActiveJobId(jobId);
    cameraRef.current?.click();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !activeJobId) return;
    Array.from(files).forEach(file => {
      uploadPhoto.mutate({ jobId: activeJobId, file, category: "during" });
    });
    e.target.value = "";
    toast.success("Photo uploaded");
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-24">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><GuzzlLogo to={null} size="lg" suffix="My Jobs" /></h1>
          <p className="text-sm text-muted-foreground">
            {todaysJobs.length} job{todaysJobs.length !== 1 ? "s" : ""} today
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          onClick={() => setShowNotifs(!showNotifs)}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </div>

      {/* Notifications Dropdown */}
      {showNotifs && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => markAllRead.mutate()}>
                Mark all read
              </Button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">No notifications</p>
          ) : (
            notifications.slice(0, 5).map((n: any) => (
              <div
                key={n.id}
                className={`p-2 rounded-lg text-sm cursor-pointer ${!n.read_at ? "bg-primary/5 border border-primary/10" : "bg-muted/30"}`}
                onClick={() => { markRead.mutate(n.id); if (n.related_id) navigate(`/app/jobs/${n.related_id}`); }}
              >
                <p className="font-medium text-xs">{n.title}</p>
                {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
              </div>
            ))
          )}
        </motion.div>
      )}

      {/* Today's Jobs */}
      {todaysJobs.length === 0 && upcomingJobs.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h2 className="font-semibold">No jobs assigned</h2>
          <p className="text-sm text-muted-foreground mt-1">You're all caught up! Check back later for new assignments.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {todaysJobs.length > 0 && (
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Today
              </h2>
            )}
            {todaysJobs.map((job: any) => {
              const status = job.status as JobStatus;
              const mapUrl = job.job_address ? `https://maps.google.com/?q=${encodeURIComponent(job.job_address)}` : null;

              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  {/* Job Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{job.job_number} · {job.job_type || "General"}</p>
                      </div>
                      <Badge className={`capitalize text-xs shrink-0 ${JOB_STATUS_COLORS[status]}`}>
                        {JOB_STATUS_LABELS[status]}
                      </Badge>
                    </div>

                    {/* Customer & Address */}
                    {job.leads && (
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <span className="text-muted-foreground">{job.leads.name}</span>
                      </div>
                    )}
                    {job.job_address && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" /> {job.job_address}
                      </div>
                    )}
                    {job.scheduled_start && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {format(new Date(job.scheduled_start), "h:mm a")}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="border-t border-border px-4 py-3 grid grid-cols-4 gap-2">
                    {mapUrl && (
                      <Button variant="outline" size="sm" className="h-12 flex-col gap-1 text-xs" asChild>
                        <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                          <Navigation className="h-4 w-4" /> Navigate
                        </a>
                      </Button>
                    )}
                    {job.leads?.phone && (
                      <Button variant="outline" size="sm" className="h-12 flex-col gap-1 text-xs" asChild>
                        <a href={`tel:${job.leads.phone}`}><Phone className="h-4 w-4" /> Call</a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-12 flex-col gap-1 text-xs"
                      onClick={() => handleCameraCapture(job.id)}
                    >
                      <Camera className="h-4 w-4" /> Photo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-12 flex-col gap-1 text-xs"
                      onClick={() => navigate(`/app/jobs/${job.id}`)}
                    >
                      <ChevronRight className="h-4 w-4" /> Details
                    </Button>
                  </div>

                  {/* Quick Note */}
                  <div className="border-t border-border px-4 py-2">
                    <div className="flex gap-2">
                      <Input
                        value={activeJobId === job.id ? quickNote : ""}
                        onFocus={() => setActiveJobId(job.id)}
                        onChange={e => { setActiveJobId(job.id); setQuickNote(e.target.value); }}
                        placeholder="Add note..."
                        className="h-10 text-sm"
                        onKeyDown={e => e.key === "Enter" && handleQuickNote(job.id, job.notes || "")}
                      />
                      <Button
                        size="sm"
                        className="h-10"
                        disabled={activeJobId !== job.id || !quickNote.trim()}
                        onClick={() => handleQuickNote(job.id, job.notes || "")}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Status Action */}
                  <div className="border-t border-border px-4 py-3">
                    {status === "scheduled" && (
                      <Button
                        className="w-full h-14 text-base gap-2"
                        onClick={() => handleStatusChange(job, "in_progress")}
                        disabled={updateStatus.isPending}
                      >
                        <Play className="h-5 w-5" /> Start Job
                      </Button>
                    )}
                    {status === "in_progress" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 h-14 text-base gap-2"
                          onClick={() => handleStatusChange(job, "paused")}
                          disabled={updateStatus.isPending}
                        >
                          <Pause className="h-5 w-5" /> Pause
                        </Button>
                        <Button
                          className="flex-1 h-14 text-base gap-2"
                          onClick={() => handleStatusChange(job, "completed")}
                          disabled={updateStatus.isPending}
                        >
                          <CheckCircle2 className="h-5 w-5" /> Complete
                        </Button>
                      </div>
                    )}
                    {status === "paused" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 h-14 text-base gap-2"
                          onClick={() => handleStatusChange(job, "in_progress")}
                          disabled={updateStatus.isPending}
                        >
                          <Play className="h-5 w-5" /> Resume
                        </Button>
                        <Button
                          className="flex-1 h-14 text-base gap-2"
                          onClick={() => handleStatusChange(job, "completed")}
                          disabled={updateStatus.isPending}
                        >
                          <CheckCircle2 className="h-5 w-5" /> Complete
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Upcoming */}
          {upcomingJobs.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-4">Upcoming</h2>
              {upcomingJobs.map((job: any) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-border bg-card p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => navigate(`/app/jobs/${job.id}`)}
                >
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground">{job.leads?.name || "No customer"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium">
                      {job.scheduled_start && format(new Date(job.scheduled_start), "MMM d")}
                    </p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      {job.scheduled_start && format(new Date(job.scheduled_start), "h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
