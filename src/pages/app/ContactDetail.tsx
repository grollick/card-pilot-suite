import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft, Phone, Mail, Calendar, FileText, MessageSquare,
  Plus, Clock, CheckCircle2, Loader2, Building2, Circle,
  ExternalLink, MoreHorizontal, ChevronDown, Trash2, User,
  MapPin, Globe, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useContact, useContactActivities, useContactTasks, useContactBookings } from "@/hooks/useContactDetail";
import { useLogActivity, useUpdateContact } from "@/hooks/useContactActions";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import { useTags, useToggleContactTag, useCreateTag, usePipelineStages } from "@/hooks/useContacts";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow, addDays } from "date-fns";
import ActivityComposer from "@/components/contacts/ActivityComposer";
import ContactTimeline, { type TimelineFilter } from "@/components/contacts/ContactTimeline";
import NextActivityPanel from "@/components/contacts/NextActivityPanel";
import { supabase } from "@/integrations/supabase/client";

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "nurture", label: "Nurture" },
];

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: contact, isLoading, refetch } = useContact(id);
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
  const createTagMut = useCreateTag();

  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState("follow_up");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [newTagName, setNewTagName] = useState("");
  const [rightTab, setRightTab] = useState("timeline");

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!contact) return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/contacts")} className="gap-2 -ml-2"><ArrowLeft className="h-4 w-4" /> Contacts</Button>
      <p className="text-muted-foreground">Contact not found.</p>
    </div>
  );

  const initials = contact.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
  const stage = (contact as any).pipeline_stages;
  const contactTags = ((contact as any).contact_tags ?? []).map((ct: any) => ct.tags).filter(Boolean);
  const contactTagIds = new Set(contactTags.map((t: any) => t.id));
  const openTasks = tasks.filter((t: any) => t.status === "open");
  const doneTasks = tasks.filter((t: any) => t.status === "done");
  const nextTask = openTasks.length > 0 ? openTasks.sort((a: any, b: any) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))[0] : null;

  const handleLogQuickAction = async (type: string, title: string) => {
    await logActivity.mutateAsync({ lead_id: contact.id, activity_type: type, title });
    toast.success(`${title}`);
  };

  const handleStageChange = async (stageId: string) => {
    const fromName = stage?.name ?? "None";
    const toStage = stages.find((s: any) => s.id === stageId);
    await updateContact.mutateAsync({ id: contact.id, stage_id: stageId });
    await logActivity.mutateAsync({
      lead_id: contact.id,
      activity_type: "stage_changed",
      title: `Stage: ${fromName} → ${toStage?.name ?? "Unknown"}`,
    });
    toast.success("Stage updated");
  };

  const handleStatusChange = async (status: string) => {
    await updateContact.mutateAsync({ id: contact.id, status });
    toast.success("Status updated");
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;
    await createTask.mutateAsync({ title: taskTitle, lead_id: contact.id, type: taskType, due_date: taskDue || null, priority: taskPriority });
    toast.success("Task created");
    setTaskTitle(""); setTaskDue(""); setTaskDialogOpen(false);
  };

  const handleSnooze = async (days: number) => {
    if (!nextTask) return;
    const newDate = format(addDays(new Date(), days), "yyyy-MM-dd");
    await updateTask.mutateAsync({ id: nextTask.id, leadId: contact.id, due_date: newDate, title: nextTask.title });
    toast.success(`Snoozed ${days} day${days > 1 ? "s" : ""}`);
  };

  const handleDeleteContact = async () => {
    if (!confirm(`Delete ${contact.name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("leads").delete().eq("id", contact.id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Contact deleted");
    navigate("/app/contacts");
  };

  return (
    <div className="max-w-7xl space-y-4">
      {/* ── Top Header Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" onClick={() => navigate("/app/contacts")} className="gap-1.5 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Contacts
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{contact.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Create dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Create <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setTaskDialogOpen(true)}>
                <FileText className="h-4 w-4 mr-2" /> Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/app/email?new=1")}>
                <Mail className="h-4 w-4 mr-2" /> Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/app/booking?new=1")}>
                <Calendar className="h-4 w-4 mr-2" /> Booking
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="text-destructive" onClick={handleDeleteContact}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── 2-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── LEFT COLUMN (35%) ── */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4 space-y-4">
          {/* Contact Summary Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary shrink-0">{initials}</div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{contact.name}</h1>
                {contact.company && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                    <Building2 className="h-3 w-3 shrink-0" />{contact.company}
                  </p>
                )}
              </div>
            </div>

            {/* Stage + Status */}
            <div className="flex items-center gap-2">
              <Select value={contact.stage_id ?? "none"} onValueChange={handleStageChange}>
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Set stage" /></SelectTrigger>
                <SelectContent>
                  {stages.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={contact.status ?? "open"} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-8 text-xs w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="flex gap-1.5 flex-wrap items-center">
              {contactTags.map((tag: any) => (
                <button key={tag.id} onClick={() => toggleTag.mutate({ leadId: contact.id, tagId: tag.id, add: false })}
                  className="text-xs px-2 py-0.5 rounded-full border hover:line-through transition-all"
                  style={{ borderColor: tag.color, color: tag.color }} title="Remove">
                  {tag.name}
                </button>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-1.5"><Plus className="h-3 w-3" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-2" align="start">
                  <div className="space-y-1 max-h-32 overflow-auto">
                    {allTags.filter((t: any) => !contactTagIds.has(t.id)).map((t: any) => (
                      <button key={t.id} onClick={() => toggleTag.mutate({ leadId: contact.id, tagId: t.id, add: true })}
                        className="w-full text-left text-sm px-2 py-1 rounded hover:bg-muted flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />{t.name}
                      </button>
                    ))}
                  </div>
                  <Separator className="my-2" />
                  <div className="flex gap-1">
                    <Input placeholder="New tag..." value={newTagName} onChange={e => setNewTagName(e.target.value)} className="h-7 text-xs" />
                    <Button size="sm" className="h-7 text-xs px-2" onClick={async () => {
                      if (!newTagName.trim()) return;
                      const tag = await createTagMut.mutateAsync(newTagName);
                      await toggleTag.mutateAsync({ leadId: contact.id, tagId: tag.id, add: true });
                      setNewTagName(""); toast.success("Tag added");
                    }}>Add</Button>
                  </div>
                </PopoverContent>
              </Popover>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground ml-auto">{contact.source}</span>
            </div>
          </div>

          {/* Quick Actions (big buttons) */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Phone, label: "Call", action: () => handleLogQuickAction("call", "Call logged") },
              { icon: MessageSquare, label: "Text", action: () => handleLogQuickAction("cta_click", "Text sent") },
              { icon: Mail, label: "Email", action: () => navigate("/app/email?new=1") },
              { icon: Calendar, label: "Book", action: () => navigate("/app/booking?new=1") },
            ].map(a => (
              <Button key={a.label} variant="outline" className="flex-col h-16 gap-1 text-xs" onClick={a.action}>
                <a.icon className="h-5 w-5" />
                {a.label}
              </Button>
            ))}
          </div>

          {/* Key Properties */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Properties</p>
            {[
              { icon: Phone, label: "Phone", value: contact.phone },
              { icon: Mail, label: "Email", value: contact.email },
              { icon: MapPin, label: "Address", value: (contact as any).address },
              { icon: User, label: "Preferred contact", value: (contact as any).preferred_contact_method },
              { icon: Clock, label: "Created", value: format(new Date(contact.created_at), "MMM d, yyyy") },
              { icon: Clock, label: "Last activity", value: contact.last_activity_at ? formatDistanceToNow(new Date(contact.last_activity_at), { addSuffix: true }) : "Never" },
              { icon: Clock, label: "Next activity", value: contact.next_activity_at ? formatDistanceToNow(new Date(contact.next_activity_at), { addSuffix: true }) : "None" },
              { icon: Star, label: "Lead score", value: String((contact as any).lead_score ?? 0) },
              { icon: Globe, label: "Lifecycle", value: (contact as any).lifecycle_stage ?? "lead" },
            ].map((prop, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <prop.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground text-xs w-24 shrink-0">{prop.label}</span>
                <span className={`truncate flex-1 text-xs ${!prop.value || prop.value === "Never" || prop.value === "None" ? "text-muted-foreground/50" : ""}`}>
                  {prop.value || "—"}
                </span>
              </div>
            ))}
          </div>

          {/* Next Activity Panel */}
          <NextActivityPanel nextTask={nextTask} onCreateTask={() => setTaskDialogOpen(true)} onSnooze={handleSnooze} />

          {/* Tasks */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasks ({openTasks.length})</p>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setTaskDialogOpen(true)}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {openTasks.length === 0 && doneTasks.length === 0 && <p className="text-xs text-muted-foreground">No tasks</p>}
              {openTasks.map((t: any) => (
                <div key={t.id} className="flex items-center gap-2 text-sm">
                  <button onClick={() => updateTask.mutate({ id: t.id, leadId: contact.id, status: "done", title: t.title })}>
                    <Circle className={`h-4 w-4 shrink-0 ${t.priority === "high" ? "text-destructive" : t.priority === "medium" ? "text-[hsl(var(--warning))]" : "text-muted-foreground/40"}`} />
                  </button>
                  <span className="flex-1 truncate text-xs">{t.title}</span>
                  {t.due_date && <span className="text-[10px] text-muted-foreground">{format(new Date(t.due_date), "MMM d")}</span>}
                </div>
              ))}
              {doneTasks.slice(0, 2).map((t: any) => (
                <div key={t.id} className="flex items-center gap-2 text-xs opacity-50">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] shrink-0" />
                  <span className="flex-1 line-through truncate">{t.title}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT COLUMN (65%) ── */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-8 space-y-4">
          {/* Activity Composer */}
          <ActivityComposer contactId={contact.id} contactName={contact.name} />

          {/* Tabs: Timeline / Bookings / About */}
          <Tabs value={rightTab} onValueChange={setRightTab}>
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0">
              <TabsTrigger value="timeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 pb-2">Timeline</TabsTrigger>
              <TabsTrigger value="bookings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 pb-2">
                Bookings {bookings.length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] h-4">{bookings.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 pb-2">About</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <ContactTimeline activities={activities} filter={timelineFilter} onFilterChange={setTimelineFilter} />
              </div>
            </TabsContent>

            <TabsContent value="bookings" className="mt-4">
              <div className="rounded-xl border border-border bg-card p-5">
                {bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No bookings yet.</p>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((b: any) => (
                      <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                        <Calendar className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{format(new Date(b.start_datetime), "EEEE, MMM d · h:mm a")}</p>
                          {b.booking_services?.name && <p className="text-xs text-muted-foreground">{b.booking_services.name}</p>}
                          {b.notes && <p className="text-xs text-muted-foreground mt-1">{b.notes}</p>}
                        </div>
                        <Badge variant={b.status === "confirmed" ? "default" : b.status === "cancelled" ? "destructive" : "outline"} className="text-xs">
                          {b.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="about" className="mt-4">
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-semibold text-sm">All Properties</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ["Full Name", contact.name],
                    ["Email", contact.email],
                    ["Phone", contact.phone],
                    ["Company", contact.company],
                    ["Source", contact.source],
                    ["Status", contact.status],
                    ["Lifecycle Stage", (contact as any).lifecycle_stage],
                    ["Lead Score", String((contact as any).lead_score ?? 0)],
                    ["Preferred Contact", (contact as any).preferred_contact_method],
                    ["Address", (contact as any).address],
                    ["Timezone", (contact as any).timezone],
                    ["Language", (contact as any).preferred_language],
                    ["Created", format(new Date(contact.created_at), "MMM d, yyyy h:mm a")],
                    ["Last Updated", format(new Date(contact.updated_at), "MMM d, yyyy h:mm a")],
                  ].map(([label, value], i) => (
                    <div key={i}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Task creation dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
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
                    {["call","email","text","follow_up","meeting","other"].map(t => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ")}</SelectItem>
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
    </div>
  );
}
