import { Circle, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useUpdateTask } from "@/hooks/useTasks";

interface Props {
  contactId: string;
  tasks: any[];
  onCreateTask: () => void;
}

export default function ContactTasksList({ contactId, tasks, onCreateTask }: Props) {
  const updateTask = useUpdateTask();
  const openTasks = tasks.filter((t: any) => t.status === "open");
  const doneTasks = tasks.filter((t: any) => t.status === "done");

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasks ({openTasks.length})</p>
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onCreateTask}>
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {openTasks.length === 0 && doneTasks.length === 0 && <p className="text-xs text-muted-foreground">No tasks</p>}
        {openTasks.map((t: any) => (
          <div key={t.id} className="flex items-center gap-2 text-sm">
            <button onClick={() => updateTask.mutate({ id: t.id, leadId: contactId, status: "done", title: t.title })}>
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
  );
}
