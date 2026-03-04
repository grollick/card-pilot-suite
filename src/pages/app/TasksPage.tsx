import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CheckCircle2, Circle, Clock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useTasks, useCreateTask, useToggleTask } from "@/hooks/useTasks";
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

export default function TasksPage() {
  const navigate = useNavigate();
  const { data: tasks = [], isLoading } = useTasks();
  const { data: contacts = [] } = useContacts();
  const createTask = useCreateTask();
  const toggleTask = useToggleTask();
  const [showDone, setShowDone] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [leadId, setLeadId] = useState("none");

  const pending = tasks.filter((t: any) => !t.completed);
  const completed = tasks.filter((t: any) => t.completed);

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createTask.mutateAsync({
      title,
      due_date: dueDate || null,
      priority,
      lead_id: leadId === "none" ? null : leadId,
    });
    toast.success("Task created");
    setTitle(""); setDueDate(""); setPriority("medium"); setLeadId("none");
    setNewOpen(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">{pending.length} pending · {completed.length} completed</p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-glow"><Plus className="h-4 w-4 mr-2" /> Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Task title *" value={title} onChange={e => setTitle(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
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

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : pending.length === 0 && completed.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tasks yet. Click "Add Task" to create one.</p>
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card divide-y divide-border">
            {pending.map((task: any) => (
              <div key={task.id} className="flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
                <button className="shrink-0" onClick={() => toggleTask.mutate({ id: task.id, completed: true })}>
                  <Circle className={`h-5 w-5 ${priorityColors[task.priority] ?? "text-muted-foreground"}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.leads?.name && (
                    <button
                      className="flex items-center gap-1 mt-0.5 hover:underline"
                      onClick={() => navigate(`/app/contacts/${task.lead_id}`)}
                    >
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{task.leads.name}</span>
                    </button>
                  )}
                </div>
                {task.due_date && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    <span className={task.due_date <= new Date().toISOString().split("T")[0] ? "text-destructive font-medium" : ""}>
                      {format(new Date(task.due_date), "MMM d")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </motion.div>

          {completed.length > 0 && (
            <div>
              <button onClick={() => setShowDone(!showDone)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {showDone ? "Hide" : "Show"} completed ({completed.length})
              </button>
              {showDone && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="rounded-xl border border-border bg-card divide-y divide-border mt-3">
                  {completed.map((task: any) => (
                    <div key={task.id} className="flex items-center gap-3 p-4 opacity-60">
                      <button onClick={() => toggleTask.mutate({ id: task.id, completed: false })}>
                        <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))] shrink-0" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-through">{task.title}</p>
                        {task.leads?.name && (
                          <span className="text-xs text-muted-foreground">{task.leads.name}</span>
                        )}
                      </div>
                      {task.due_date && <span className="text-xs text-muted-foreground">{format(new Date(task.due_date), "MMM d")}</span>}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
