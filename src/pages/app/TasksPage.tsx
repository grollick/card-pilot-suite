import { useState } from "react";
import { Plus, CheckCircle2, Circle, Clock, User, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const mockTasks = [
  { id: "1", text: "Follow up with Sarah Johnson", due: "Today", contact: "Sarah Johnson", done: false, priority: "high" },
  { id: "2", text: "Send proposal to Lisa Park", due: "Today", contact: "Lisa Park", done: false, priority: "high" },
  { id: "3", text: "Call John Doe about booking", due: "Tomorrow", contact: "John Doe", done: false, priority: "medium" },
  { id: "4", text: "Prepare consultation notes", due: "Mar 6", contact: null, done: false, priority: "low" },
  { id: "5", text: "Initial outreach to Mike Chen", due: "Mar 1", contact: "Mike Chen", done: true, priority: "medium" },
  { id: "6", text: "Send welcome email", due: "Feb 28", contact: "Sarah Johnson", done: true, priority: "low" },
];

const priorityColors: Record<string, string> = {
  high: "text-destructive",
  medium: "text-[hsl(var(--warning))]",
  low: "text-muted-foreground",
};

export default function TasksPage() {
  const [showDone, setShowDone] = useState(false);
  const pending = mockTasks.filter(t => !t.done);
  const completed = mockTasks.filter(t => t.done);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">{pending.length} pending · {completed.length} completed</p>
        </div>
        <Button className="shadow-glow">
          <Plus className="h-4 w-4 mr-2" /> Add Task
        </Button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card divide-y divide-border">
        {pending.map((task) => (
          <div key={task.id} className="flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors cursor-pointer">
            <button className="shrink-0">
              <Circle className={`h-5 w-5 ${priorityColors[task.priority]}`} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{task.text}</p>
              {task.contact && (
                <div className="flex items-center gap-1 mt-0.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{task.contact}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              <Clock className="h-3 w-3" />
              <span className={task.due === "Today" ? "text-destructive font-medium" : ""}>{task.due}</span>
            </div>
          </div>
        ))}
      </motion.div>

      <div>
        <button
          onClick={() => setShowDone(!showDone)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showDone ? "Hide" : "Show"} completed ({completed.length})
        </button>
        {showDone && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="rounded-xl border border-border bg-card divide-y divide-border mt-3">
            {completed.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-4 opacity-60">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-through">{task.text}</p>
                </div>
                <span className="text-xs text-muted-foreground">{task.due}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
