import { useNavigate } from "react-router-dom";
import {
  Users, ArrowUpRight, Circle, Plus,
  FileText, QrCode, MessageSquareQuote,
  UserPlus, CalendarCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useDashboardStats, useRecentActivity } from "@/hooks/useDashboardStats";
import { formatDistanceToNow, format } from "date-fns";
import AIInsightsWidget from "@/components/dashboard/AIInsightsWidget";
import BusinessPerformancePanel from "@/components/dashboard/BusinessPerformancePanel";
import YesterdaySnapshot from "@/components/dashboard/YesterdaySnapshot";
import MissedOpportunities from "@/components/dashboard/MissedOpportunities";
import FirstLeadAssistant from "@/components/dashboard/FirstLeadAssistant";

const priorityColors: Record<string, string> = {
  high: "text-destructive",
  medium: "text-warning",
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
  booking: "bg-success/10 text-success",
  quote: "bg-warning/10 text-warning",
  qr_scan: "bg-accent/10 text-accent",
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] as const },
};

export default function DashboardHome() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: feed = [], isLoading: feedLoading } = useRecentActivity();
  const { data: allTasks = [], isLoading: tasksLoading } = useTasks({ status: "open" });
  const updateTask = useUpdateTask();

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = allTasks.filter((t: any) => t.due_date && t.due_date <= today);
  const upcomingTasks = allTasks.filter((t: any) => t.due_date && t.due_date > today).slice(0, 4);

  const maxStageCount = Math.max(...(stats?.stageCounts ?? []).map(s => s.count), 1);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          Track your leads, bookings, and revenue in real time.
        </p>
      </div>

      {/* Business Performance Panel */}
      <BusinessPerformancePanel />

      {/* Yesterday's Snapshot */}
      <YesterdaySnapshot />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Activity Feed + Missed Opportunities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Missed Opportunities */}
          <MissedOpportunities />

          {/* Activity Feed */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="dash-card">
            <div className="dash-card-header">
              <h2 className="font-semibold text-sm">Recent Activity</h2>
              <Badge variant="secondary" className="text-2xs font-medium">Last 7 days</Badge>
            </div>
            <div className="dash-card-body">
              {feedLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
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
                <div className="space-y-0.5">
                  {feed.map(item => {
                    const Icon = feedIcons[item.type] ?? FileText;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
                        onClick={() => {
                          if (item.type === "lead" || item.type === "quote") navigate(`/app/contacts/${item.id}`);
                          else if (item.type === "booking") navigate("/app/bookings");
                          else if (item.type === "qr_scan") navigate("/app/qr");
                        }}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${feedColors[item.type]}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                        </div>
                        <span className="text-2xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pipeline Snapshot */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="dash-card">
            <div className="dash-card-header">
              <h2 className="font-semibold text-sm">Pipeline</h2>
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/app/pipeline")}>
                Open <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="dash-card-body">
              {statsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2 w-full rounded-full" />
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
                        <span className="text-xs font-semibold text-muted-foreground tabular-nums">{stage.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
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
            </div>
          </motion.div>

          {/* Today's Tasks */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }}
            className="dash-card">
            <div className="dash-card-header">
              <h2 className="font-semibold text-sm">Today's Tasks <span className="text-muted-foreground font-normal">({todayTasks.length})</span></h2>
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/app/tasks")}>
                View all <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="dash-card-body">
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
                <div className="space-y-0.5">
                  {todayTasks.slice(0, 6).map((task: any) => (
                    <div key={task.id} className="flex items-center gap-2.5 py-1.5 group">
                      <button
                        onClick={() => updateTask.mutate({ id: task.id, leadId: task.lead_id, status: "done", title: task.title })}
                        className="hover:scale-110 transition-transform"
                      >
                        <Circle className={`h-4 w-4 shrink-0 ${priorityColors[task.priority]}`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{task.title}</p>
                        {task.leads?.name && (
                          <button onClick={() => navigate(`/app/contacts/${task.lead_id}`)} className="text-2xs text-primary hover:underline truncate block">
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
                  <p className="text-2xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Coming up</p>
                  {upcomingTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center gap-2.5 py-1 opacity-50">
                      <Circle className={`h-3.5 w-3.5 shrink-0 ${priorityColors[task.priority]}`} />
                      <span className="text-xs flex-1 truncate">{task.title}</span>
                      <span className="text-2xs text-muted-foreground tabular-nums">{task.due_date && format(new Date(task.due_date), "MMM d")}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button variant="ghost" size="sm" className="mt-3 text-xs gap-1 w-full justify-center h-8" onClick={() => navigate("/app/tasks")}>
                <Plus className="h-3 w-3" /> Add Task
              </Button>
            </div>
          </motion.div>

          {/* First Lead Checklist */}
          <FirstLeadAssistant />
        </div>
      </div>

      {/* AI Insights */}
      <AIInsightsWidget />
    </div>
  );
}
