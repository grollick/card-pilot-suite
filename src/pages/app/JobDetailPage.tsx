import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, MessageSquare, User, FileText, Plus, Trash2,
  Loader2, Camera, CheckCircle2, Circle, Image as ImageIcon, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
  useJob, useUpdateJob, useUpdateJobStatus,
  useJobTasks, useCreateJobTask, useUpdateJobTask, useDeleteJobTask,
  useJobPhotos, useUploadJobPhoto, useDeleteJobPhoto,
  useJobMaterials, useCreateJobMaterial, useDeleteJobMaterial,
  JOB_STATUS_LABELS, JOB_STATUS_COLORS, type JobStatus
} from "@/hooks/useJobs";

const STATUS_FLOW: Record<JobStatus, { next: JobStatus; label: string }[]> = {
  draft: [{ next: "scheduled", label: "Schedule" }],
  scheduled: [{ next: "in_progress", label: "Start Job" }],
  in_progress: [{ next: "paused", label: "Pause" }, { next: "completed", label: "Complete" }],
  paused: [{ next: "in_progress", label: "Resume" }, { next: "completed", label: "Complete" }],
  completed: [],
  cancelled: [{ next: "draft", label: "Reopen" }],
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading } = useJob(id);
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
  const [photoCategory, setPhotoCategory] = useState("during");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newMatName, setNewMatName] = useState("");
  const [newMatQty, setNewMatQty] = useState(1);
  const [newMatCost, setNewMatCost] = useState(0);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!job) return <div className="text-center py-12 text-muted-foreground">Job not found</div>;

  const status = job.status as JobStatus;
  const actions = STATUS_FLOW[status] ?? [];
  const materialTotal = materials.reduce((s: number, m: any) => s + (Number(m.quantity) * Number(m.unit_cost)), 0);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      uploadPhoto.mutate({ jobId: id!, file, category: photoCategory });
    });
    e.target.value = "";
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

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/jobs")}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{job.title}</h1>
            <Badge className={`capitalize ${JOB_STATUS_COLORS[status]}`}>{JOB_STATUS_LABELS[status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{job.job_number} · {job.job_type ?? "General"}</p>
        </div>
        <div className="flex gap-2">
          {actions.map(a => (
            <Button key={a.next} size="sm" variant={a.next === "completed" ? "default" : "outline"}
              onClick={() => updateStatus.mutate({ id: id!, status: a.next, lead_id: job.lead_id, job_number: job.job_number })}>
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dash-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Customer</p>
          <p className="font-medium">{job.leads?.name ?? "—"}</p>
          {job.leads?.phone && <p className="text-xs text-muted-foreground">{job.leads.phone}</p>}
          <div className="flex gap-2 mt-2">
            {job.leads?.phone && <Button variant="outline" size="sm" className="text-xs gap-1" asChild><a href={`tel:${job.leads.phone}`}><Phone className="h-3 w-3" /> Call</a></Button>}
            {job.leads?.phone && <Button variant="outline" size="sm" className="text-xs gap-1" asChild><a href={`sms:${job.leads.phone}`}><MessageSquare className="h-3 w-3" /> Text</a></Button>}
            {job.lead_id && <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate(`/app/contacts/${job.lead_id}`)}><User className="h-3 w-3" /> Contact</Button>}
          </div>
        </div>
        <div className="dash-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Address</p>
          <p className="font-medium text-sm">{job.job_address || "—"}</p>
          <p className="text-xs text-muted-foreground mb-1 mt-3">Schedule</p>
          <p className="text-sm">{job.scheduled_start ? format(new Date(job.scheduled_start), "MMM d, yyyy h:mm a") : "Not scheduled"}</p>
        </div>
        <div className="dash-card p-4">
          {job.estimate_id && (
            <>
              <p className="text-xs text-muted-foreground mb-1">Estimate</p>
              <p className="font-medium text-sm">{job.estimates?.estimate_number ?? "Linked"}</p>
              {job.estimates?.grand_total && <p className="text-lg font-bold tabular-nums">${Number(job.estimates.grand_total).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>}
              <Button variant="ghost" size="sm" className="text-xs gap-1 mt-1" onClick={() => navigate("/app/estimates")}><FileText className="h-3 w-3" /> View Estimate</Button>
            </>
          )}
          {!job.estimate_id && <p className="text-xs text-muted-foreground">No linked estimate</p>}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="photos">Photos ({photos.length})</TabsTrigger>
          <TabsTrigger value="materials">Materials ({materials.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-3">
          <div className="flex gap-2">
            <Input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Add a task…" className="flex-1"
              onKeyDown={e => e.key === "Enter" && handleAddTask()} />
            <Button size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim()}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-1">
            {tasks.map((task: any) => (
              <div key={task.id} className="dash-card p-3 flex items-center gap-3">
                <button onClick={() => updateTask.mutate({ id: task.id, job_id: id!, status: task.status === "completed" ? "not_started" : "completed" })}>
                  {task.status === "completed" ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                  {task.due_date && <p className="text-[10px] text-muted-foreground">{format(new Date(task.due_date + "T00:00:00"), "MMM d")}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteTask.mutate({ id: task.id, job_id: id! })}><Trash2 className="h-3 w-3 text-muted-foreground" /></Button>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>}
          </div>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-3">
          <div className="flex items-center gap-2">
            <Select value={photoCategory} onValueChange={setPhotoCategory}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="before">Before</SelectItem>
                <SelectItem value="during">During</SelectItem>
                <SelectItem value="after">After</SelectItem>
              </SelectContent>
            </Select>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadPhoto.isPending}>
              {uploadPhoto.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
              Upload Photos
            </Button>
          </div>

          {(["before", "during", "after"] as const).map(cat => {
            const catPhotos = photos.filter((p: any) => p.category === cat);
            if (catPhotos.length === 0) return null;
            return (
              <div key={cat}>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 capitalize">{cat}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {catPhotos.map((photo: any) => (
                    <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                      <img src={photo.photo_url} alt={photo.caption ?? ""} className="w-full h-full object-cover" />
                      <button
                        onClick={() => deletePhoto.mutate({ id: photo.id, jobId: id! })}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {photos.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No photos yet. Upload before, during, and after photos.</p>}
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1"><Label className="text-xs">Material</Label><Input value={newMatName} onChange={e => setNewMatName(e.target.value)} placeholder="Material name" /></div>
            <div className="w-20"><Label className="text-xs">Qty</Label><Input type="number" value={newMatQty} onChange={e => setNewMatQty(+e.target.value)} min={0} /></div>
            <div className="w-24"><Label className="text-xs">Cost $</Label><Input type="number" value={newMatCost} onChange={e => setNewMatCost(+e.target.value)} min={0} step={0.01} /></div>
            <Button size="sm" onClick={handleAddMaterial} disabled={!newMatName.trim()}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-1">
            {materials.map((mat: any) => (
              <div key={mat.id} className="dash-card p-3 flex items-center gap-3">
                <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{mat.name}</p>
                  <p className="text-xs text-muted-foreground">{mat.quantity} × ${Number(mat.unit_cost).toFixed(2)}</p>
                </div>
                <p className="text-sm font-medium tabular-nums">${(Number(mat.quantity) * Number(mat.unit_cost)).toFixed(2)}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMaterial.mutate({ id: mat.id, jobId: id! })}><Trash2 className="h-3 w-3 text-muted-foreground" /></Button>
              </div>
            ))}
          </div>
          {materials.length > 0 && (
            <div className="flex justify-end"><p className="text-sm font-semibold">Total: <span className="tabular-nums">${materialTotal.toFixed(2)}</span></p></div>
          )}
          {materials.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No materials tracked</p>}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-3">
          <div>
            <Label>Job Notes</Label>
            <Textarea defaultValue={job.notes ?? ""} rows={4} placeholder="Notes visible to team…"
              onBlur={e => { if (e.target.value !== (job.notes ?? "")) updateJob.mutate({ id: id!, notes: e.target.value }); }} />
          </div>
          <div>
            <Label>Internal Notes</Label>
            <Textarea defaultValue={job.internal_notes ?? ""} rows={3} placeholder="Private notes…" className="border-dashed"
              onBlur={e => { if (e.target.value !== (job.internal_notes ?? "")) updateJob.mutate({ id: id!, internal_notes: e.target.value }); }} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
