import { useNavigate } from "react-router-dom";
import {
  Users, Calendar, ArrowUpRight, Circle, Plus,
  Loader2, FileText, TrendingUp, QrCode, MessageSquareQuote,
  UserPlus, CalendarCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useDashboardStats, useRecentActivity } from "@/hooks/useDashboardStats";
import { formatDistanceToNow, format } from "date-fns";

const priorityColors: Record<string, string> = {
  high: "text-destructive",
  medium: "text-[hsl(var(--warning))]",
  low: "text-muted-foreground",
};

const feedIcons: Record<string, typeof Users> = {
  lead: UserPlus,
  booking: CalendarCheck,
  quote: MessageSquareQuote,
  qr_scan: QrCode,
};

const feedColors: Record<string, string> = {
  lead: "bg-primary/10 text-primary",
  booking: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  quote: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  qr_scan: "bg-accent text-accent-foreground",
};

const anim = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

export default function DashboardHome() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: feed = [], isLoading: feedLoading } = useRecentActivity();
  const { data: allTasks = [], isLoading: tasksLoading } = useTasks({ status: "open" });
  const updateTask = useUpdateTask();

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = allTasks.filter((t: any) => t.due_date && t.due_date <= today);
  const upcomingTasks = allTasks.filter((t: any) => t.due_date && t.due_date > today).slice(0, 4);

  const kpis = [
    { label: "New Leads Today", value: stats?.leadsToday ?? 0, icon: UserPlus, color: "text-primary bg-primary/10" },
    { label: "Bookings This Week", value: stats?.bookingsWeek ?? 0, icon: CalendarCheck, color: "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10" },
    { label: "Active Opportunities", value: stats?.activeOpportunities ?? 0, icon: TrendingUp, color: "text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10" },
    { label: "Pipeline Leads", value: stats?.pipelineValue ?? 0, icon: Users, color: "text-accent-foreground bg-accent" },
  ];

  const maxStageCount = Math.max(...(stats?.stageCounts ?? []).map(s => s.count), 1);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time overview of your business activity.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            {...anim}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold tracking-tight">{kpi.value}</p>
                )}
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid: Activity Feed + Pipeline + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Activity Feed — spans 2 cols */}
        <motion.div {...anim} transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Activity</h2>
            <Badge variant="secondary" className="text-[10px]">Last 7 days</Badge>
          </div>
          {feedLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-3 w-14" />
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity yet.</p>
          ) : (
            <div className="space-y-1">
              {feed.map(item => {
                const Icon = feedIcons[item.type] ?? FileText;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => {
                      if (item.type === "lead" || item.type === "quote") navigate(`/app/contacts/${item.id}`);
                      else if (item.type === "booking") navigate("/app/bookings");
                      else if (item.type === "qr_scan") navigate("/app/qr");
                    }}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${feedColors[item.type]}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Right Column: Pipeline + Tasks */}
        <div className="space-y-6">
          {/* Pipeline Snapshot */}
          <motion.div {...anim} transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Pipeline</h2>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/app/pipeline")}>
                Open <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
            {statsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : (stats?.stageCounts ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No pipeline stages configured.</p>
            ) : (
              <div className="space-y-3">
                {(stats?.stageCounts ?? []).map(stage => (
                  <div key={stage.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">{stage.name}</span>
                      <span className="text-xs font-semibold text-muted-foreground">{stage.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(stage.count / maxStageCount) * 100}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Today's Tasks */}
          <motion.div {...anim} transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Today's Tasks ({todayTasks.length})</h2>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/app/tasks")}>
                View all <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
            {tasksLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-3.5 w-full" />
                  </div>
                ))}
              </div>
            ) : todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tasks due today ✓</p>
            ) : (
              <div className="space-y-1">
                {todayTasks.slice(0, 6).map((task: any) => (
                  <div key={task.id} className="flex items-center gap-2.5 py-1.5">
                    <button onClick={() => updateTask.mutate({ id: task.id, leadId: task.lead_id, status: "done", title: task.title })}>
                      <Circle className={`h-4.5 w-4.5 shrink-0 ${priorityColors[task.priority]}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{task.title}</p>
                      {task.leads?.name && (
                        <button onClick={() => navigate(`/app/contacts/${task.lead_id}`)} className="text-[11px] text-primary hover:underline truncate block">
                          {task.leads.name}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {upcomingTasks.length > 0 && (
              <div className="border-t border-border mt-3 pt-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Coming up</p>
                {upcomingTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center gap-2.5 py-1 opacity-60">
                    <Circle className={`h-3.5 w-3.5 shrink-0 ${priorityColors[task.priority]}`} />
                    <span className="text-xs flex-1 truncate">{task.title}</span>
                    <span className="text-[10px] text-muted-foreground">{task.due_date && format(new Date(task.due_date), "MMM d")}</span>
                  </div>
                ))}
              </div>
            )}

            <Button variant="ghost" size="sm" className="mt-3 text-xs gap-1 w-full justify-center" onClick={() => navigate("/app/tasks")}>
              <Plus className="h-3 w-3" /> Add Task
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
