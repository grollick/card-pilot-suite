import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CheckCircle2, Circle, Clock, User, Loader2, Phone, Mail, MessageSquare, Calendar, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useTasks, useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import { useContacts } from "@/hooks/useContacts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

const priorityColors: Record<string, string> = {
  high: "text-destructive",
  medium: "text-[hsl(var(--warning))]",
  low: "text-muted-foreground",
};

const typeIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  text: MessageSquare,
  follow_up: Clock,
  meeting: Calendar,
  reminder: Clock,
  other: MoreHorizontal,
};

const typeLabels: Record<string, string> = {
  call: "Call", email: "Email", text: "Text",
  follow_up: "Follow-up", meeting: "Meeting", reminder: "Reminder", other: "Other",
};

type ViewFilter = "all" | "open" | "done" | "overdue";

export default function TasksPage() {
  const navigate = useNavigate();
  const { data: allTasks = [], isLoading } = useTasks();
  const { data: contacts = [] } = useContacts();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [viewFilter, setViewFilter] = useState<ViewFilter>("open");
  const [newOpen, setNewOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [taskType, setTaskType] = useState("follow_up");
  const [leadId, setLeadId] = useState("none");

  const today = new Date().toISOString().split("T")[0];

  const tasks = allTasks.filter((t: any) => {
    if (viewFilter === "open") return t.status === "open";
    if (viewFilter === "done") return t.status === "done";
    if (viewFilter === "overdue") return t.status === "open" && t.due_date && t.due_date < today;
    return true;
  });

  const openCount = allTasks.filter((t: any) => t.status === "open").length;
  const overdueCount = allTasks.filter((t: any) => t.status === "open" && t.due_date && t.due_date < today).length;
  const doneCount = allTasks.filter((t: any) => t.status === "done").length;

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createTask.mutateAsync({
      title,
      due_date: dueDate || null,
      priority,
      type: taskType,
      lead_id: leadId === "none" ? null : leadId,
    });
    toast.success("Task created");
    setTitle(""); setDueDate(""); setPriority("medium"); setTaskType("follow_up"); setLeadId("none");
    setNewOpen(false);
  };

  const handleComplete = (task: any) => {
    updateTask.mutate({
      id: task.id,
      leadId: task.lead_id,
      status: task.status === "done" ? "open" : "done",
      title: task.title,
    });
  };

  const views: { key: ViewFilter; label: string; count: number }[] = [
    { key: "open", label: "Open", count: openCount },
    { key: "overdue", label: "Overdue", count: overdueCount },
    { key: "done", label: "Done", count: doneCount },
    { key: "all", label: "All", count: allTasks.length },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><span className="font-black text-primary text-4xl">guzzl</span> <span className="font-normal text-muted-foreground">Tasks</span></h1>
          <p className="text-muted-foreground text-sm mt-1">{openCount} open · {overdueCount > 0 && <span className="text-destructive">{overdueCount} overdue · </span>}{doneCount} done</p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-glow"><Plus className="h-4 w-4 mr-2" /> Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Task title *" value={title} onChange={e => setTitle(e.target.value)} />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Type</label>
                  <Select value={taskType} onValueChange={setTaskType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Due date</label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Priority</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Link to contact</label>
                <Select value={leadId} onValueChange={setLeadId}>
                  <SelectTrigger><SelectValue placeholder="No contact" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No contact</SelectItem>
                    {contacts.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={createTask.isPending} className="w-full">Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View tabs */}
      <div className="flex gap-2">
        {views.map(v => (
          <button
            key={v.key}
            onClick={() => setViewFilter(v.key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              viewFilter === v.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {v.label} ({v.count})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {allTasks.length === 0 ? 'No tasks yet. Click "Add Task" to create one.' : "No tasks match this filter."}
          </p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card divide-y divide-border">
          {tasks.map((task: any) => {
            const isDone = task.status === "done";
            const isOverdue = !isDone && task.due_date && task.due_date < today;
            const TypeIcon = typeIcons[task.type] ?? Clock;
            return (
              <div key={task.id} className={`flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors ${isDone ? "opacity-50" : ""}`}>
                <button className="shrink-0" onClick={() => handleComplete(task)}>
                  {isDone
                    ? <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
                    : <Circle className={`h-5 w-5 ${priorityColors[task.priority] ?? "text-muted-foreground"}`} />
                  }
                </button>
                <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDone ? "line-through" : ""}`}>{task.title}</p>
                  {task.leads?.name && (
                    <button
                      className="flex items-center gap-1 mt-0.5 hover:underline"
                      onClick={(e) => { e.stopPropagation(); navigate(`/app/contacts/${task.lead_id}`); }}
                    >
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-primary">{task.leads.name}</span>
                    </button>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] hidden sm:flex">{typeLabels[task.type] ?? task.type}</Badge>
                {task.due_date && (
                  <div className="flex items-center gap-1.5 text-xs shrink-0">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className={isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}>
                      {format(new Date(task.due_date), "MMM d")}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
