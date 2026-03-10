import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Timer } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Props {
  nextTask: any | null;
  onCreateTask: () => void;
  onSnooze: (days: number) => void;
}

export default function NextActivityPanel({ nextTask, onCreateTask, onSnooze }: Props) {
  const isOverdue = nextTask?.due_date && new Date(nextTask.due_date) < new Date();

  return (
    <div className={`rounded-xl border p-4 ${isOverdue ? "border-destructive/50 bg-destructive/5" : "border-border bg-card"}`}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Next Activity</p>

      {nextTask ? (
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Clock className={`h-4 w-4 mt-0.5 shrink-0 ${isOverdue ? "text-destructive" : "text-primary"}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{nextTask.title}</p>
              {nextTask.due_date && (
                <p className={`text-xs mt-0.5 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {isOverdue ? "Overdue" : "Due"} {formatDistanceToNow(new Date(nextTask.due_date), { addSuffix: true })}
                  {" · "}
                  {format(new Date(nextTask.due_date), "MMM d")}
                </p>
              )}
              <Badge variant="outline" className="text-[10px] mt-1">{nextTask.type ?? "follow_up"}</Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs flex-1 gap-1" onClick={() => onSnooze(1)}>
              <Timer className="h-3 w-3" /> +1d
            </Button>
            <Button variant="outline" size="sm" className="text-xs flex-1 gap-1" onClick={() => onSnooze(3)}>
              <Timer className="h-3 w-3" /> +3d
            </Button>
            <Button variant="outline" size="sm" className="text-xs flex-1 gap-1" onClick={() => onSnooze(7)}>
              <Timer className="h-3 w-3" /> +1w
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-3">
          <p className="text-sm text-muted-foreground mb-2">No task scheduled</p>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onCreateTask}>
            <Plus className="h-3 w-3" /> Create Task
          </Button>
        </div>
      )}
    </div>
  );
}
