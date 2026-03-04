import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft, Phone, Mail, Calendar, FileText, MessageSquare,
  Plus, Clock, CheckCircle2, Eye, MousePointer, Users, Loader2,
  Building2, Tag, Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useContact, useContactActivities, useContactTasks, useContactBookings } from "@/hooks/useContactDetail";
import { useLogActivity, useUpdateContact } from "@/hooks/useContactActions";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import { useTags, useToggleContactTag, useCreateTag, usePipelineStages } from "@/hooks/useContacts";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { format, formatDistanceToNow } from "date-fns";

const activityIcons: Record<string, typeof Eye> = {
  card_view: Eye,
  cta_click: MousePointer,
  form_submit: Users,
  booking_created: Calendar,
  booking_cancelled: Calendar,
  email_sent: Mail,
  note: MessageSquare,
  note_added: MessageSquare,
  call: Phone,
  task_created: FileText,
  task_completed: CheckCircle2,
  stage_changed: Circle,
};

const activityColors: Record<string, string> = {
  card_view: "text-muted-foreground",
  cta_click: "text-primary",
  form_submit: "text-primary",
  booking_created: "text-[hsl(var(--success))]",
  booking_cancelled: "text-destructive",
  email_sent: "text-muted-foreground",
  note: "text-muted-foreground",
  note_added: "text-muted-foreground",
  call: "text-primary",
  task_created: "text-muted-foreground",
  task_completed: "text-[hsl(var(--success))]",
  stage_changed: "text-primary",
};

const taskTypeLabels: Record<string, string> = {
  call: "Call",
  email: "Email",
  text: "Text",
  follow_up: "Follow-up",
  meeting: "Meeting",
  other: "Other",
};

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(id);
  const { data: activities = [] } = useContactActivities(id);
  const { data: tasks = [] } = useContactTasks(id);
  const { data: bookings = [] } = useContactBookings(id);
  const { data: allTags = [] } = useTags();
  const { data: stages = [] } = usePipelineStages();
  const logActivity = useLogActivity();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const updateContact = useUpdateContact();
  const toggleTag = useToggleContactTag();
  const createTag = useCreateTag();

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskType, setTaskType] = useState("follow_up");
  const [taskDue, setTaskDue] = useState("");
  const [newTagName, setNewTagName] = useState("");

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!contact) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/contacts")} className="gap-2 -ml-2"><ArrowLeft className="h-4 w-4" /> Contacts</Button>
        <p className="text-muted-foreground">Contact not found.</p>
      </div>
    );
  }

  const initials = contact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
  const stage = (contact as any).pipeline_stages;
  const contactTags = ((contact as any).contact_tags ?? []).map((ct: any) => ct.tags).filter(Boolean);
  const contactTagIds = new Set(contactTags.map((t: any) => t.id));
  const openTasks = tasks.filter((t: any) => t.status === "open");
  const doneTasks = tasks.filter((t: any) => t.status === "done");

  const handleLogNote = async () => {
    if (!noteText.trim()) return;
    await logActivity.mutateAsync({ lead_id: contact.id, activity_type: "note_added", title: "Note added", description: noteText });
    toast.success("Note logged");
    setNoteText("");
    setNoteOpen(false);
  };

  const handleLogCall = async () => {
    await logActivity.mutateAsync({ lead_id: contact.id, activity_type: "call", title: "Call logged" });
    toast.success("Call logged");
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;
    await createTask.mutateAsync({ title: taskTitle, lead_id: contact.id, priority: taskPriority, type: taskType, due_date: taskDue || null });
    toast.success("Task created");
    setTaskTitle(""); setTaskDue(""); setTaskType("follow_up");
    setTaskOpen(false);
  };

  const handleStageChange = async (stageId: string) => {
    const fromName = stage?.name ?? "None";
    const toStage = stages.find((s: any) => s.id === stageId);
    await updateContact.mutateAsync({ id: contact.id, stage_id: stageId });
    await logActivity.mutateAsync({
      lead_id: contact.id,
      activity_type: "stage_changed",
      title: `Stage changed: ${fromName} → ${toStage?.name ?? "Unknown"}`,
    });
    toast.success("Stage updated");
  };

  const handleAddTag = async (tagId: string) => {
    await toggleTag.mutateAsync({ leadId: contact.id, tagId, add: true });
  };

  const handleRemoveTag = async (tagId: string) => {
    await toggleTag.mutateAsync({ leadId: contact.id, tagId, add: false });
  };

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) return;
    const tag = await createTag.mutateAsync(newTagName);
    await toggleTag.mutateAsync({ leadId: contact.id, tagId: tag.id, add: true });
    setNewTagName("");
    toast.success("Tag created & added");
  };

  return (
    <div className="max-w-6xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/contacts")} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Contacts
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Contact Info ── */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">{initials}</div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{contact.name}</h1>
                {contact.company && <p className="text-sm text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" />{contact.company}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <Select value={stage?.id ?? "none"} onValueChange={handleStageChange}>
                    <SelectTrigger className="h-7 text-xs w-auto min-w-[100px]"><SelectValue placeholder="Set stage" /></SelectTrigger>
                    <SelectContent>
                      {stages.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant={contact.status === "won" ? "default" : contact.status === "lost" ? "destructive" : "outline"} className="text-[10px]">
                    {contact.status}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              {contact.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4 shrink-0" /> <span className="truncate">{contact.email}</span></div>}
              {contact.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 shrink-0" /> {contact.phone}</div>}
              <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 shrink-0" /> Added {format(new Date(contact.created_at), "MMM d, yyyy")}</div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <span className="px-2 py-0.5 rounded-full bg-muted">{contact.source}</span>
              </div>
            </div>

            <Separator />

            {/* Last / Next activity */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5">Last activity</p>
                <p className="font-medium">
                  {contact.last_activity_at
                    ? formatDistanceToNow(new Date(contact.last_activity_at), { addSuffix: true })
                    : <span className="text-destructive/70">Never</span>}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Next activity</p>
                <p className={`font-medium ${contact.next_activity_at && new Date(contact.next_activity_at) < new Date() ? "text-destructive" : ""}`}>
                  {contact.next_activity_at
                    ? formatDistanceToNow(new Date(contact.next_activity_at), { addSuffix: true })
                    : "None"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Tags */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Tags</p>
              <div className="flex gap-1.5 flex-wrap">
                {contactTags.map((tag: any) => (
                  <button
                    key={tag.id}
                    onClick={() => handleRemoveTag(tag.id)}
                    className="text-xs px-2 py-0.5 rounded-full border hover:line-through transition-all"
                    style={{ borderColor: tag.color, color: tag.color }}
                    title="Click to remove"
                  >
                    {tag.name}
                  </button>
                ))}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2"><Plus className="h-3 w-3 mr-1" /> Tag</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="start">
                    <div className="space-y-1 max-h-40 overflow-auto">
                      {allTags.filter((t: any) => !contactTagIds.has(t.id)).map((t: any) => (
                        <button
                          key={t.id}
                          onClick={() => handleAddTag(t.id)}
                          className="w-full text-left text-sm px-2 py-1 rounded hover:bg-muted transition-colors flex items-center gap-2"
                        >
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.name}
                        </button>
                      ))}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex gap-1">
                      <Input placeholder="New tag..." value={newTagName} onChange={e => setNewTagName(e.target.value)} className="h-7 text-xs" />
                      <Button size="sm" className="h-7 text-xs px-2" onClick={handleCreateNewTag}>Add</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {contact.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{contact.notes}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 justify-start text-xs" onClick={handleLogCall}>
                <Phone className="h-3.5 w-3.5" /> Log Call
              </Button>
              <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 justify-start text-xs"><MessageSquare className="h-3.5 w-3.5" /> Add Note</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Note for {contact.name}</DialogTitle></DialogHeader>
                  <Textarea placeholder="Write a note..." value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} />
                  <Button onClick={handleLogNote} disabled={logActivity.isPending}>Save Note</Button>
                </DialogContent>
              </Dialog>
              <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 justify-start text-xs"><FileText className="h-3.5 w-3.5" /> Create Task</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Task for {contact.name}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Task title..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Type</label>
                        <Select value={taskType} onValueChange={setTaskType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(taskTypeLabels).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Due date</label>
                        <Input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Priority</label>
                        <Select value={taskPriority} onValueChange={setTaskPriority}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleCreateTask} disabled={createTask.isPending} className="w-full">Create Task</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" className="gap-1.5 justify-start text-xs" onClick={() => navigate("/app/email?new=1")}>
                <Mail className="h-3.5 w-3.5" /> Send Email
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 justify-start text-xs col-span-2" onClick={() => navigate("/app/booking?new=1")}>
                <Calendar className="h-3.5 w-3.5" /> Book Appointment
              </Button>
            </div>
          </div>

          {/* Tasks */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasks ({openTasks.length} open)</p>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setTaskOpen(true)}><Plus className="h-3 w-3 mr-1" /> Add</Button>
            </div>
            <div className="space-y-2">
              {openTasks.length === 0 && doneTasks.length === 0 && <p className="text-xs text-muted-foreground">No tasks yet</p>}
              {openTasks.map((task: any) => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  <button onClick={() => updateTask.mutate({ id: task.id, leadId: contact.id, status: "done", title: task.title })}>
                    <Circle className={`h-4 w-4 shrink-0 ${task.priority === "high" ? "text-destructive" : task.priority === "medium" ? "text-[hsl(var(--warning))]" : "text-muted-foreground/40"}`} />
                  </button>
                  <span className="flex-1 truncate">{task.title}</span>
                  <span className="text-[10px] text-muted-foreground">{taskTypeLabels[task.type] ?? task.type}</span>
                  {task.due_date && <span className="text-xs text-muted-foreground">{format(new Date(task.due_date), "MMM d")}</span>}
                </div>
              ))}
              {doneTasks.slice(0, 3).map((task: any) => (
                <div key={task.id} className="flex items-center gap-2 text-sm opacity-50">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] shrink-0" />
                  <span className="flex-1 line-through truncate">{task.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bookings */}
          {bookings.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Bookings</p>
              <div className="space-y-2">
                {bookings.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{format(new Date(b.start_datetime), "MMM d, h:mm a")}</p>
                      {b.booking_services?.name && <p className="text-xs text-muted-foreground">{b.booking_services.name}</p>}
                    </div>
                    <Badge variant="outline" className="text-[10px]">{b.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Right: Activity Timeline ── */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-4">Activity Timeline</h2>
            {activities.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet. Use Quick Actions to log your first interaction.</p>
            )}
            <div className="space-y-0">
              {activities.map((item: any, i: number) => {
                const Icon = activityIcons[item.activity_type] ?? MessageSquare;
                const color = activityColors[item.activity_type] ?? "text-muted-foreground";
                return (
                  <div key={item.id} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      {i < activities.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="pt-1 pb-3 min-w-0">
                      <p className="text-sm">{item.title}</p>
                      {item.description && <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{item.description}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(item.occurred_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
