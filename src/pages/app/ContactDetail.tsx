import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft, Phone, Mail, Calendar, FileText, MessageSquare,
  Plus, Loader2, ChevronDown, Trash2, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useContact, useContactActivities, useContactTasks, useContactBookings, useContactFollowups } from "@/hooks/useContactDetail";
import { useLogActivity } from "@/hooks/useContactActions";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow, addDays } from "date-fns";
import ActivityComposer from "@/components/contacts/ActivityComposer";
import ContactTimeline, { type TimelineFilter } from "@/components/contacts/ContactTimeline";
import NextActivityPanel from "@/components/contacts/NextActivityPanel";
import ContactSummaryCard from "@/components/contacts/ContactSummaryCard";
import ContactTasksList from "@/components/contacts/ContactTasksList";
import { supabase } from "@/integrations/supabase/client";

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: contact, isLoading } = useContact(id);
  const { data: activities = [] } = useContactActivities(id);
  const { data: tasks = [] } = useContactTasks(id);
  const { data: bookings = [] } = useContactBookings(id);
  const logActivity = useLogActivity();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState("follow_up");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [rightTab, setRightTab] = useState("timeline");

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!contact) return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/contacts")} className="gap-2 -ml-2"><ArrowLeft className="h-4 w-4" /> Contacts</Button>
      <p className="text-muted-foreground">Contact not found.</p>
    </div>
  );

  const openTasks = tasks.filter((t: any) => t.status === "open");
  const nextTask = openTasks.length > 0 ? openTasks.sort((a: any, b: any) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))[0] : null;

  const handleLogQuickAction = async (type: string, title: string) => {
    await logActivity.mutateAsync({ lead_id: contact.id, activity_type: type, title });
    toast.success(title);
  };

  const handleMarkReplied = async (_activityId: string, leadId: string) => {
    await logActivity.mutateAsync({
      lead_id: leadId,
      activity_type: "email_replied",
      title: "Replied (marked from timeline)",
    });
    toast.success("Marked as replied");
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
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" onClick={() => navigate("/app/contacts")} className="gap-1.5 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Contacts
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{contact.name}</span>
        </div>
        <div className="flex items-center gap-2">
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
              <DropdownMenuItem onClick={() => navigate("/app/bookings?new=1")}>
                <Calendar className="h-4 w-4 mr-2" /> Booking
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4 space-y-4">
          <ContactSummaryCard contact={contact} />

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Phone, label: "Call", action: () => handleLogQuickAction("call", "Call logged") },
              { icon: MessageSquare, label: "Text", action: () => handleLogQuickAction("cta_click", "Text sent") },
              { icon: Mail, label: "Email", action: () => navigate("/app/email?new=1") },
              { icon: Calendar, label: "Book", action: () => navigate("/app/bookings?new=1") },
            ].map(a => (
              <Button key={a.label} variant="outline" className="flex-col h-16 gap-1 text-xs" onClick={a.action}>
                <a.icon className="h-5 w-5" />
                {a.label}
              </Button>
            ))}
          </div>

          <NextActivityPanel nextTask={nextTask} onCreateTask={() => setTaskDialogOpen(true)} onSnooze={handleSnooze} />
          <ContactTasksList contactId={contact.id} tasks={tasks} onCreateTask={() => setTaskDialogOpen(true)} />
        </motion.div>

        {/* RIGHT COLUMN */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-8 space-y-4">
          <ActivityComposer contactId={contact.id} contactName={contact.name} />

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
                <ContactTimeline activities={activities} filter={timelineFilter} onFilterChange={setTimelineFilter} onMarkReplied={handleMarkReplied} />
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
