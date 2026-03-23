import { useState } from "react";
import {
  Plus, Loader2, Briefcase, MoreHorizontal, Search, Filter, Trash2,
  LayoutList, LayoutGrid, Play, Pause, CheckCircle2, XCircle, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  useJobs, useCreateJob, useUpdateJobStatus, useDeleteJob, generateJobNumber,
  JOB_STATUS_LABELS, JOB_STATUS_COLORS, KANBAN_COLUMNS,
  type JobStatus
} from "@/hooks/useJobs";
import { useContacts } from "@/hooks/useContacts";

export default function JobsPage() {
  const navigate = useNavigate();
  const { data: jobs = [], isLoading } = useJobs();
  const createJob = useCreateJob();
  const updateStatus = useUpdateJobStatus();
  const deleteJob = useDeleteJob();
  const { data: contacts = [] } = useContacts();

  const [view, setView] = useState<"table" | "kanban">("table");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newLeadId, setNewLeadId] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newJobType, setNewJobType] = useState("");
  const [newScheduledStart, setNewScheduledStart] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const filtered = jobs.filter((j: any) => {
    if (statusFilter !== "all" && j.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(j.title?.toLowerCase() ?? "").includes(s) && !(j.job_number?.toLowerCase() ?? "").includes(s) && !(j.leads?.name?.toLowerCase() ?? "").includes(s)) return false;
    }
    return true;
  });

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createJob.mutateAsync({
      title: newTitle,
      job_number: generateJobNumber(),
      lead_id: newLeadId || null,
      job_address: newAddress,
      job_type: newJobType,
      scheduled_start: newScheduledStart ? new Date(newScheduledStart).toISOString() : undefined,
      notes: newNotes,
      status: newScheduledStart ? "scheduled" : "draft",
    });
    setCreateOpen(false);
    setNewTitle(""); setNewLeadId(""); setNewAddress(""); setNewJobType(""); setNewScheduledStart(""); setNewNotes("");
  };

  // Quick stats
  const active = jobs.filter((j: any) => ["scheduled", "in_progress"].includes(j.status)).length;
  const completed = jobs.filter((j: any) => j.status === "completed").length;
  const totalValue = jobs.filter((j: any) => j.status === "completed").reduce((s: number, j: any) => s + Number(j.estimates?.grand_total || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><span className="font-black text-primary">guzzl</span> <span className="font-normal">Jobs</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and track your active jobs</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-border rounded-md overflow-hidden">
            <Button variant={view === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setView("table")} className="rounded-none"><LayoutList className="h-4 w-4" /></Button>
            <Button variant={view === "kanban" ? "secondary" : "ghost"} size="sm" onClick={() => setView("kanban")} className="rounded-none"><LayoutGrid className="h-4 w-4" /></Button>
          </div>
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Job</Button>
        </div>
      </div>

      {/* Stats */}
      {jobs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="dash-card p-3"><div className="text-xs text-muted-foreground">Active Jobs</div><div className="text-xl font-bold tabular-nums">{active}</div></div>
          <div className="dash-card p-3"><div className="text-xs text-muted-foreground">Completed</div><div className="text-xl font-bold tabular-nums">{completed}</div></div>
          <div className="dash-card p-3"><div className="text-xs text-muted-foreground">Total Jobs</div><div className="text-xl font-bold tabular-nums">{jobs.length}</div></div>
          <div className="dash-card p-3"><div className="text-xs text-muted-foreground">Completed Value</div><div className="text-xl font-bold tabular-nums">${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div></div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><Filter className="h-3.5 w-3.5 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(JOB_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : jobs.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="dash-card p-12 text-center">
          <Briefcase className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No jobs yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create a job or convert an approved estimate.</p>
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Job</Button>
        </motion.div>
      ) : view === "kanban" ? (
        <KanbanView jobs={filtered} onStatusChange={(id, status, leadId, jobNum) => updateStatus.mutate({ id, status, lead_id: leadId, job_number: jobNum })} onOpen={id => navigate(`/app/jobs/${id}`)} />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dash-card overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Job #</TableHead><TableHead>Title</TableHead><TableHead>Customer</TableHead>
              <TableHead>Status</TableHead><TableHead>Scheduled</TableHead><TableHead className="text-right">Est. Value</TableHead>
              <TableHead className="w-10" />
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((job: any) => (
                <TableRow key={job.id} className="cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/app/jobs/${job.id}`)}>
                  <TableCell className="font-mono text-sm">{job.job_number}</TableCell>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{job.leads?.name ?? "—"}</TableCell>
                  <TableCell><Badge className={`capitalize ${JOB_STATUS_COLORS[job.status as JobStatus] ?? ""}`}>{JOB_STATUS_LABELS[job.status as JobStatus] ?? job.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{job.scheduled_start ? format(new Date(job.scheduled_start), "MMM d, yyyy") : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{job.estimates?.grand_total ? `$${Number(job.estimates.grand_total).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {job.status === "draft" && <DropdownMenuItem onClick={() => updateStatus.mutate({ id: job.id, status: "scheduled", lead_id: job.lead_id, job_number: job.job_number })}><Play className="h-3.5 w-3.5 mr-2" /> Schedule</DropdownMenuItem>}
                        {job.status === "scheduled" && <DropdownMenuItem onClick={() => updateStatus.mutate({ id: job.id, status: "in_progress", lead_id: job.lead_id, job_number: job.job_number })}><Play className="h-3.5 w-3.5 mr-2" /> Start</DropdownMenuItem>}
                        {job.status === "in_progress" && <DropdownMenuItem onClick={() => updateStatus.mutate({ id: job.id, status: "paused", lead_id: job.lead_id, job_number: job.job_number })}><Pause className="h-3.5 w-3.5 mr-2" /> Pause</DropdownMenuItem>}
                        {job.status === "paused" && <DropdownMenuItem onClick={() => updateStatus.mutate({ id: job.id, status: "in_progress", lead_id: job.lead_id, job_number: job.job_number })}><Play className="h-3.5 w-3.5 mr-2" /> Resume</DropdownMenuItem>}
                        {["scheduled", "in_progress", "paused"].includes(job.status) && <DropdownMenuItem onClick={() => updateStatus.mutate({ id: job.id, status: "completed", lead_id: job.lead_id, job_number: job.job_number })}><CheckCircle2 className="h-3.5 w-3.5 mr-2 text-success" /> Complete</DropdownMenuItem>}
                        {!["completed", "cancelled"].includes(job.status) && <DropdownMenuItem onClick={() => updateStatus.mutate({ id: job.id, status: "cancelled", lead_id: job.lead_id, job_number: job.job_number })}><XCircle className="h-3.5 w-3.5 mr-2 text-destructive" /> Cancel</DropdownMenuItem>}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteJob.mutate(job.id)}><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {/* Create Job Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Job</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div><Label>Job Title</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Kitchen Renovation" /></div>
            <div><Label>Contact</Label>
              <Select value={newLeadId} onValueChange={setNewLeadId}>
                <SelectTrigger><SelectValue placeholder="Select contact…" /></SelectTrigger>
                <SelectContent>{contacts.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Job Type</Label><Input value={newJobType} onChange={e => setNewJobType(e.target.value)} placeholder="Renovation" /></div>
              <div><Label>Scheduled Date</Label><Input type="datetime-local" value={newScheduledStart} onChange={e => setNewScheduledStart(e.target.value)} /></div>
            </div>
            <div><Label>Address</Label><Input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="123 Main St" /></div>
            <div><Label>Notes</Label><Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} rows={2} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim() || createJob.isPending}>
              {createJob.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Job
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Kanban View ──

function KanbanView({ jobs, onStatusChange, onOpen }: {
  jobs: any[]; onStatusChange: (id: string, status: JobStatus, leadId?: string, jobNum?: string) => void; onOpen: (id: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {KANBAN_COLUMNS.map(col => {
        const colJobs = jobs.filter(j => j.status === col);
        return (
          <div
            key={col}
            className="min-h-[200px] rounded-xl border border-border bg-muted/20 p-3"
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              if (dragId) {
                const job = jobs.find(j => j.id === dragId);
                if (job && job.status !== col) onStatusChange(dragId, col, job.lead_id, job.job_number);
                setDragId(null);
              }
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <Badge className={`${JOB_STATUS_COLORS[col]} capitalize`}>{JOB_STATUS_LABELS[col]}</Badge>
              <span className="text-xs text-muted-foreground tabular-nums">{colJobs.length}</span>
            </div>
            <div className="space-y-2">
              {colJobs.map(job => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={() => setDragId(job.id)}
                  onClick={() => onOpen(job.id)}
                  className="dash-card p-3 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <p className="text-sm font-medium truncate">{job.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{job.leads?.name ?? "No contact"}</p>
                  {job.scheduled_start && <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">{format(new Date(job.scheduled_start), "MMM d, h:mm a")}</p>}
                  {job.estimates?.grand_total && <p className="text-xs font-medium mt-1 tabular-nums">${Number(job.estimates.grand_total).toLocaleString("en-US", { minimumFractionDigits: 0 })}</p>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
