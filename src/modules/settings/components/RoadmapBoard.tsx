import { useMemo } from "react";
import { motion } from "framer-motion";
import { Kanban, Bug, AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useBugIssues, useUpdateBugIssue, type BugIssue, type RoadmapStatus, type PriorityLevel } from "@/hooks/useBugIssues";

const COLUMNS: { status: RoadmapStatus; label: string; color: string }[] = [
  { status: "backlog", label: "Backlog", color: "border-muted-foreground/30" },
  { status: "next_up", label: "Next Up", color: "border-primary/40" },
  { status: "in_progress", label: "In Progress", color: "border-amber-500/40" },
  { status: "done", label: "Done", color: "border-emerald-500/40" },
];

const PRIORITY_DOT: Record<PriorityLevel, string> = {
  critical: "bg-destructive",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-muted-foreground/40",
};

const NEXT_STATUS: Record<RoadmapStatus, RoadmapStatus | null> = {
  backlog: "next_up",
  next_up: "in_progress",
  in_progress: "done",
  done: null,
};

export default function RoadmapBoard() {
  const { data: issues = [], isLoading } = useBugIssues();
  const updateIssue = useUpdateBugIssue();

  const columns = useMemo(() => {
    const map: Record<RoadmapStatus, BugIssue[]> = {
      backlog: [], next_up: [], in_progress: [], done: [],
    };
    for (const issue of issues) {
      map[issue.roadmap_status]?.push(issue);
    }
    // Sort each column by priority_score desc
    for (const col of Object.values(map)) {
      col.sort((a, b) => b.priority_score - a.priority_score);
    }
    return map;
  }, [issues]);

  const moveForward = (issue: BugIssue) => {
    const next = NEXT_STATUS[issue.roadmap_status];
    if (!next) return;
    updateIssue.mutate({
      id: issue.id,
      roadmap_status: next,
      resolved_at: next === "done" ? new Date().toISOString() : null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Kanban className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Fix Roadmap</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className={`rounded-lg border-2 ${col.color} bg-card min-h-[200px]`}>
            {/* Column Header */}
            <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <Badge variant="secondary" className="text-xs">{columns[col.status].length}</Badge>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2">
              {columns[col.status].length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No issues</p>
              ) : (
                columns[col.status].map((issue, idx) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="rounded-md border border-border bg-background p-2.5 space-y-1.5 group"
                  >
                    <div className="flex items-start gap-1.5">
                      <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${PRIORITY_DOT[issue.priority_level]}`} />
                      <p className="text-sm font-medium leading-tight">{issue.title}</p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {issue.feature_tag && (
                        <Badge variant="outline" className="text-[10px] h-5">{issue.feature_tag}</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        Score: {issue.priority_score}
                      </span>
                      {issue.report_count > 1 && (
                        <span className="text-[10px] text-muted-foreground">
                          · {issue.report_count} reports
                        </span>
                      )}
                    </div>

                    {NEXT_STATUS[col.status] && (
                      <button
                        onClick={() => moveForward(issue)}
                        className="flex items-center gap-1 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Move to {COLUMNS.find((c) => c.status === NEXT_STATUS[col.status])?.label}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
