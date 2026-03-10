import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, MessageSquare, User, FileText, Plus, Trash2,
  Loader2, Camera, CheckCircle2, Circle, Package, Play, Pause,
  Clock, MapPin, Navigation, ChevronDown, PenTool, RefreshCw, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useJob, useUpdateJob, useUpdateJobStatus,
  useJobTasks, useCreateJobTask, useUpdateJobTask, useDeleteJobTask,
  useJobPhotos, useUploadJobPhoto, useDeleteJobPhoto,
  useJobMaterials, useCreateJobMaterial, useDeleteJobMaterial,
  JOB_STATUS_LABELS, JOB_STATUS_COLORS, type JobStatus
} from "@/hooks/useJobs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import MobileQuickActions from "@/modules/jobs/components/MobileQuickActions";
import SignaturePad from "@/modules/jobs/components/SignaturePad";
import JobSummaryDialog from "@/modules/jobs/components/JobSummaryDialog";
import TechAssistantSheet from "@/modules/jobs/components/TechAssistantSheet";

const STATUS_FLOW: Record<JobStatus, { next: JobStatus; label: string; icon: typeof Play; variant: "default" | "outline" | "destructive" }[]> = {
  draft: [{ next: "scheduled", label: "Schedule Job", icon: Play, variant: "default" }],
  scheduled: [{ next: "in_progress", label: "Start Job", icon: Play, variant: "default" }],
  in_progress: [
    { next: "paused", label: "Pause", icon: Pause, variant: "outline" },
    { next: "completed", label: "Complete Job", icon: CheckCircle2, variant: "default" },
  ],
  paused: [
    { next: "in_progress", label: "Resume", icon: Play, variant: "default" },
    { next: "completed", label: "Complete Job", icon: CheckCircle2, variant: "default" },
  ],
  completed: [],
  cancelled: [{ next: "draft", label: "Reopen", icon: Play, variant: "outline" }],
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: job, isLoading, refetch } = useJob(id);
  const updateJob = useUpdateJob();
  const updateStatus = useUpdateJobStatus();
  const { data: tasks = [] } = useJobTasks(id);
  const createTask = useCreateJobTask();
  const updateTask = useUpdateJobTask();
  const deleteTask = useDeleteJobTask();
  const { data: photos = [] } = useJobPhotos(id);
  const uploadPhoto = useUploadJobPhoto();
  const deletePhoto = useDeleteJobPhoto();
  const { data: materials = [] } = useJobMaterials(id);
  const createMaterial = useCreateJobMaterial();
  const deleteMaterial = useDeleteJobMaterial();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [photoCategory, setPhotoCategory] = useState("during");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newMatName, setNewMatName] = useState("");
  const [newMatQty, setNewMatQty] = useState(1);
  const [newMatCost, setNewMatCost] = useState(0);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [sigName, setSigName] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [quickNote, setQuickNote] = useState("");
  const [assistOpen, setAssistOpen] = useState(false);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!job) return <div className="text-center py-12 text-muted-foreground">Job not found</div>;

  const status = job.status as JobStatus;
  const actions = STATUS_FLOW[status] ?? [];
  const materialTotal = materials.reduce((s: number, m: any) => s + (Number(m.quantity) * Number(m.unit_cost)), 0);
  const completedTaskCount = tasks.filter((t: any) => t.status === "completed").length;

  // Duration calculation
  const getDuration = () => {
    if (!job.actual_start) return null;
    const end = job.actual_end ? new Date(job.actual_end) : new Date();
    const mins = Math.round((end.getTime() - new Date(job.actual_start).getTime()) / 60000);
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `${mins}m`;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      uploadPhoto.mutate({ jobId: id!, file, category: photoCategory });
    });
    e.target.value = "";
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    createTask.mutate({ job_id: id!, title: newTaskTitle });
    setNewTaskTitle("");
  };

  const handleAddMaterial = () => {
    if (!newMatName.trim()) return;
    createMaterial.mutate({ job_id: id!, name: newMatName, quantity: newMatQty, unit_cost: newMatCost });
    setNewMatName(""); setNewMatQty(1); setNewMatCost(0);
  };

  const handleStatusChange = (nextStatus: JobStatus) => {
    updateStatus.mutate(
      { id: id!, status: nextStatus, lead_id: job.lead_id, job_number: job.job_number },
      {
        onSuccess: () => {
          if (nextStatus === "completed") {
            setSummaryOpen(true);
          }
        },
      }
    );
  };

  const handleSignatureSave = async (dataUrl: string) => {
    if (!user) return;
    // Upload signature image
    const blob = await (await fetch(dataUrl)).blob();
    const path = `signatures/${user.id}/${id}/${Date.now()}.png`;
    const { error: uploadErr } = await supabase.storage.from("card-assets").upload(path, blob, { contentType: "image/png" });
    if (uploadErr) { toast.error("Failed to upload signature"); return; }
    const { data: urlData } = supabase.storage.from("card-assets").getPublicUrl(path);

    updateJob.mutate({
      id: id!,
      signature_url: urlData.publicUrl,
      signature_name: sigName || job.leads?.name || "Customer",
      signed_at: new Date().toISOString(),
    }, {
      onSuccess: () => {
        setSignatureOpen(false);
        toast.success("Signature captured");
        refetch();
      },
    });
  };

  const handleQuickNote = () => {
    if (!quickNote.trim()) return;
    const existing = job.notes || "";
    const stamp = format(new Date(), "MMM d, h:mm a");
    const updated = `${existing}\n\n[${stamp}] ${quickNote}`.trim();
    updateJob.mutate({ id: id!, notes: updated });
    setQuickNote("");
    toast.success("Note added");
  };

  const mapUrl = job.job_address ? `https://maps.google.com/?q=${encodeURIComponent(job.job_address)}` : null;

  return (
    <div className="space-y-4 max-w-5xl pb-24 md:pb-0">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />

      {/* Header - compact on mobile */}
      <div className="flex items-start gap-2">
        <Button variant="ghost" size="icon" className="shrink-0 mt-0.5" onClick={() => navigate("/app/jobs")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg md:text-xl font-bold truncate">{job.title}</h1>
            <Badge className={`capitalize text-xs ${JOB_STATUS_COLORS[status]}`}>{JOB_STATUS_LABELS[status]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{job.job_number} · {job.job_type ?? "General"}</p>
        </div>
      </div>

      {/* Mobile Quick Actions */}
      {isMobile && (
        <MobileQuickActions
          phone={job.leads?.phone}
          address={job.job_address}
          contactId={job.lead_id}
          onUploadPhoto={handleCameraCapture}
          onOpenContact={() => job.lead_id && navigate(`/app/contacts/${job.lead_id}`)}
        />
      )}

      {/* Status Actions - large buttons for mobile */}
      {actions.length > 0 && (
        <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
          {actions.map(a => {
            const Icon = a.icon;
            return (
              <Button
                key={a.next}
                variant={a.variant}
                size={isMobile ? "lg" : "default"}
                className={`gap-2 ${isMobile ? "w-full h-14 text-base" : ""}`}
                onClick={() => handleStatusChange(a.next)}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                {a.label}
              </Button>
            );
          })}
        </div>
      )}

      {/* Convert to Recurring - show for completed jobs */}
      {status === "completed" && (
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate(`/app/recurring/new?job_id=${id}&lead_id=${job.lead_id || ""}&service=${encodeURIComponent(job.title)}&price=${job.estimates?.grand_total || 0}`)}
        >
          <RefreshCw className="h-4 w-4" /> Convert to Recurring Service
        </Button>
      )}

      {/* Duration badge */}
      {job.actual_start && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Clock className="h-3 w-3" />
            {status === "in_progress" ? "Running: " : "Duration: "}{getDuration()}
          </Badge>
          {job.actual_start && (
            <span className="text-xs text-muted-foreground">
              Started {formatDistanceToNow(new Date(job.actual_start), { addSuffix: true })}
            </span>
          )}
        </div>
      )}

      {/* Info cards - stacked on mobile */}
      <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
        <div className="dash-card p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Customer</p>
          <p className="font-medium text-sm">{job.leads?.name ?? "—"}</p>
          {job.leads?.phone && <p className="text-xs text-muted-foreground">{job.leads.phone}</p>}
          {!isMobile && (
            <div className="flex gap-2 mt-2">
              {job.leads?.phone && <Button variant="outline" size="sm" className="text-xs gap-1 h-7" asChild><a href={`tel:${job.leads.phone}`}><Phone className="h-3 w-3" /> Call</a></Button>}
              {job.leads?.phone && <Button variant="outline" size="sm" className="text-xs gap-1 h-7" asChild><a href={`sms:${job.leads.phone}`}><MessageSquare className="h-3 w-3" /> Text</a></Button>}
              {job.lead_id && <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate(`/app/contacts/${job.lead_id}`)}><User className="h-3 w-3" /> Contact</Button>}
            </div>
          )}
        </div>

        <div className="dash-card p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Address</p>
          <p className="font-medium text-sm">{job.job_address || "—"}</p>
          {!isMobile && mapUrl && (
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 mt-1" asChild>
              <a href={mapUrl} target="_blank" rel="noopener noreferrer"><Navigation className="h-3 w-3" /> Open Maps</a>
            </Button>
          )}
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 mt-2">Schedule</p>
          <p className="text-sm">{job.scheduled_start ? format(new Date(job.scheduled_start), "MMM d, yyyy h:mm a") : "Not scheduled"}</p>
        </div>

        <div className="dash-card p-3">
          {job.estimate_id ? (
            <>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Estimate</p>
              <p className="font-medium text-sm">{job.estimates?.estimate_number ?? "Linked"}</p>
              {job.estimates?.grand_total && <p className="text-lg font-bold tabular-nums">${Number(job.estimates.grand_total).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No linked estimate</p>
          )}
          {/* Signature status */}
          <div className="mt-2">
            {job.signature_url ? (
              <div className="flex items-center gap-1.5 text-xs text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Signed by {job.signature_name}
              </div>
            ) : (
              <Button variant="outline" size="sm" className="text-xs gap-1 h-7 w-full" onClick={() => setSignatureOpen(true)}>
                <PenTool className="h-3 w-3" /> Collect Signature
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Note + AI Assistant */}
      <div className="dash-card p-3 space-y-2">
        <div className="flex gap-2">
          <Input
            value={quickNote}
            onChange={e => setQuickNote(e.target.value)}
            placeholder="Add a quick note from the field…"
            className="flex-1"
            onKeyDown={e => e.key === "Enter" && handleQuickNote()}
          />
          <Button size="sm" onClick={handleQuickNote} disabled={!quickNote.trim()}>Add</Button>
        </div>
        <Button
          variant="outline"
          className={`gap-2 ${isMobile ? "w-full h-12 text-base" : ""}`}
          onClick={() => setAssistOpen(true)}
        >
          <Sparkles className="h-4 w-4 text-primary" />
          AI Job Assistant
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-3">
        <TabsList className={`${isMobile ? "w-full grid grid-cols-4" : ""}`}>
          <TabsTrigger value="tasks" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 hidden md:inline" />
            Tasks <span className="text-muted-foreground">({completedTaskCount}/{tasks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="photos" className="gap-1">
            <Camera className="h-3.5 w-3.5 hidden md:inline" />
            Photos <span className="text-muted-foreground">({photos.length})</span>
          </TabsTrigger>
          <TabsTrigger value="materials" className="gap-1">
            <Package className="h-3.5 w-3.5 hidden md:inline" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Tasks Tab - large touch targets */}
        <TabsContent value="tasks" className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="Add a checklist item…"
              className={`flex-1 ${isMobile ? "h-12 text-base" : ""}`}
              onKeyDown={e => e.key === "Enter" && handleAddTask()}
            />
            <Button size={isMobile ? "lg" : "sm"} onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {tasks.map((task: any) => (
              <div key={task.id} className={`dash-card flex items-center gap-3 ${isMobile ? "p-4" : "p-3"}`}>
                <button
                  className="shrink-0 active:scale-90 transition-transform"
                  onClick={() => updateTask.mutate({ id: task.id, job_id: id!, status: task.status === "completed" ? "not_started" : "completed" })}
                >
                  {task.status === "completed"
                    ? <CheckCircle2 className={`${isMobile ? "h-7 w-7" : "h-5 w-5"} text-success`} />
                    : <Circle className={`${isMobile ? "h-7 w-7" : "h-5 w-5"} text-muted-foreground`} />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`${isMobile ? "text-base" : "text-sm"} ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                  {task.due_date && <p className="text-[10px] text-muted-foreground">{format(new Date(task.due_date + "T00:00:00"), "MMM d")}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => deleteTask.mutate({ id: task.id, job_id: id! })}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No tasks yet. Add checklist items above.</p>}
          </div>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-3">
          <div className={`flex items-center gap-2 ${isMobile ? "flex-col" : ""}`}>
            <div className="flex gap-2 w-full">
              <Select value={photoCategory} onValueChange={setPhotoCategory}>
                <SelectTrigger className={`w-28 ${isMobile ? "h-12" : ""}`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">Before</SelectItem>
                  <SelectItem value="during">During</SelectItem>
                  <SelectItem value="after">After</SelectItem>
                </SelectContent>
              </Select>
              {isMobile && (
                <Button variant="default" className="flex-1 h-12 gap-2 text-base" onClick={handleCameraCapture} disabled={uploadPhoto.isPending}>
                  {uploadPhoto.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                  Take Photo
                </Button>
              )}
              <Button variant="outline" className={`gap-2 ${isMobile ? "h-12" : ""}`} onClick={() => fileInputRef.current?.click()} disabled={uploadPhoto.isPending}>
                {uploadPhoto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {isMobile ? "" : "Upload"}
              </Button>
            </div>
          </div>

          {(["before", "during", "after"] as const).map(cat => {
            const catPhotos = photos.filter((p: any) => p.category === cat);
            if (catPhotos.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 capitalize">{cat}</p>
                <div className={`grid gap-2 ${isMobile ? "grid-cols-3" : "grid-cols-4 md:grid-cols-6"}`}>
                  {catPhotos.map((photo: any) => (
                    <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                      <img src={photo.photo_url} alt={photo.caption ?? ""} className="w-full h-full object-cover" />
                      <button
                        onClick={() => deletePhoto.mutate({ id: photo.id, jobId: id! })}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 md:opacity-0 active:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {photos.length === 0 && (
            <div className="text-center py-8">
              <Camera className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No photos yet</p>
              <p className="text-xs text-muted-foreground">Capture before, during, and after photos</p>
            </div>
          )}
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-3">
          <div className={`flex gap-2 ${isMobile ? "flex-col" : "items-end"}`}>
            <div className={`flex gap-2 ${isMobile ? "w-full" : "flex-1"}`}>
              <div className="flex-1"><Label className="text-xs">Material</Label><Input value={newMatName} onChange={e => setNewMatName(e.target.value)} placeholder="Material name" className={isMobile ? "h-12 text-base" : ""} /></div>
              <div className={isMobile ? "w-20" : "w-20"}><Label className="text-xs">Qty</Label><Input type="number" value={newMatQty} onChange={e => setNewMatQty(+e.target.value)} min={0} className={isMobile ? "h-12 text-base" : ""} /></div>
              <div className={isMobile ? "w-24" : "w-24"}><Label className="text-xs">Cost $</Label><Input type="number" value={newMatCost} onChange={e => setNewMatCost(+e.target.value)} min={0} step={0.01} className={isMobile ? "h-12 text-base" : ""} /></div>
            </div>
            <Button size={isMobile ? "lg" : "sm"} onClick={handleAddMaterial} disabled={!newMatName.trim()} className={isMobile ? "w-full h-12" : ""}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-1">
            {materials.map((mat: any) => (
              <div key={mat.id} className={`dash-card flex items-center gap-3 ${isMobile ? "p-4" : "p-3"}`}>
                <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className={`font-medium ${isMobile ? "text-base" : "text-sm"}`}>{mat.name}</p>
                  <p className="text-xs text-muted-foreground">{mat.quantity} × ${Number(mat.unit_cost).toFixed(2)}</p>
                </div>
                <p className={`font-medium tabular-nums ${isMobile ? "text-base" : "text-sm"}`}>${(Number(mat.quantity) * Number(mat.unit_cost)).toFixed(2)}</p>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMaterial.mutate({ id: mat.id, jobId: id! })}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
          {materials.length > 0 && (
            <div className="flex justify-end"><p className="font-semibold">Total: <span className="tabular-nums">${materialTotal.toFixed(2)}</span></p></div>
          )}
          {materials.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No materials tracked</p>}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-3">
          <div>
            <Label>Job Notes</Label>
            <Textarea defaultValue={job.notes ?? ""} rows={6} placeholder="Notes visible to team…" className={isMobile ? "text-base" : ""}
              onBlur={e => { if (e.target.value !== (job.notes ?? "")) updateJob.mutate({ id: id!, notes: e.target.value }); }} />
          </div>
          <div>
            <Label>Internal Notes</Label>
            <Textarea defaultValue={job.internal_notes ?? ""} rows={3} placeholder="Private notes…" className={`border-dashed ${isMobile ? "text-base" : ""}`}
              onBlur={e => { if (e.target.value !== (job.internal_notes ?? "")) updateJob.mutate({ id: id!, internal_notes: e.target.value }); }} />
          </div>

          {/* Signature section in notes */}
          {job.signature_url && (
            <div className="dash-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Customer Signature</p>
              <img src={job.signature_url} alt="Signature" className="h-20 object-contain border border-border rounded-lg p-2 bg-card" />
              <p className="text-xs text-muted-foreground mt-1">{job.signature_name} · {job.signed_at && format(new Date(job.signed_at), "MMM d, yyyy h:mm a")}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Mobile FAB - Complete/Start Job */}
      {isMobile && actions.length > 0 && status !== "completed" && (
        <div className="fixed bottom-4 left-4 right-4 z-50 flex gap-2">
          {actions.map(a => {
            const Icon = a.icon;
            return (
              <Button
                key={a.next}
                variant={a.variant}
                className={`flex-1 h-14 text-base gap-2 shadow-lg ${a.next === "completed" ? "bg-success hover:bg-success/90 text-success-foreground" : ""}`}
                onClick={() => handleStatusChange(a.next)}
                disabled={updateStatus.isPending}
              >
                <Icon className="h-5 w-5" /> {a.label}
              </Button>
            );
          })}
        </div>
      )}

      {/* Signature Dialog */}
      <Dialog open={signatureOpen} onOpenChange={setSignatureOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><PenTool className="h-5 w-5" /> Customer Signature</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label>Customer Name</Label>
              <Input value={sigName} onChange={e => setSigName(e.target.value)} placeholder={job.leads?.name || "Full name"} className={isMobile ? "h-12 text-base" : ""} />
            </div>
            <SignaturePad onSave={handleSignatureSave} disabled={updateJob.isPending} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Summary Dialog */}
      <JobSummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        job={job}
        tasks={tasks}
        photos={photos}
        materials={materials}
      />
    </div>
  );
}
