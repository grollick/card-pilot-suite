import { useNavigate } from "react-router-dom";
import {
  Eye, MousePointer, Users, Calendar, ArrowUpRight, Clock,
  CheckCircle2, Circle, Plus, CreditCard, Mail, Share2, Bookmark,
  AlertCircle, Loader2, Phone, FileText
} from "lucide-react";
import KPICard from "@/components/KPICard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useNeedsFollowUp } from "@/hooks/useNeedsFollowUp";
import { useAnalyticsStats } from "@/hooks/useAnalytics";
import { formatDistanceToNow, format } from "date-fns";

const quickActions = [
  { label: "Publish Card", icon: CreditCard, href: "/app/card" },
  { label: "Create Email", icon: Mail, href: "/app/email" },
  { label: "Social Post", icon: Share2, href: "/app/social" },
  { label: "Add Service", icon: Bookmark, href: "/app/bookings" },
];

const priorityColors: Record<string, string> = {
  high: "text-destructive",
  medium: "text-[hsl(var(--warning))]",
  low: "text-muted-foreground",
};

const bucketColors: Record<string, string> = {
  overdue: "bg-destructive/10 text-destructive border-destructive/30",
  new_no_response: "bg-primary/10 text-primary border-primary/30",
  due_soon: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
  stale: "bg-muted text-muted-foreground border-border",
};

export default function DashboardHome() {
  const navigate = useNavigate();
  const { data: allTasks = [], isLoading: tasksLoading } = useTasks({ status: "open" });
  const updateTask = useUpdateTask();
  const { data: followUpContacts = [], isLoading: followUpLoading } = useNeedsFollowUp();
  const { data: stats } = useAnalyticsStats(7);

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = allTasks.filter((t: any) => t.due_date && t.due_date <= today);
  const upcomingTasks = allTasks.filter((t: any) => t.due_date && t.due_date > today).slice(0, 3);

  const fmtChange = (c?: { value: number; type: string }) => {
    if (!c || c.type === "neutral") return { text: "7d", type: "neutral" as const };
    const prefix = c.type === "positive" ? "+" : "-";
    return { text: `${prefix}${c.value}% vs prev 7d`, type: c.type as "positive" | "negative" };
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Here's what needs your attention today.</p>
      </div>

      {/* KPI Row — real data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Eye} title="Card Views" value={stats?.views ?? 0}
          change={fmtChange(stats?.viewsChange).text} changeType={fmtChange(stats?.viewsChange).type} />
        <KPICard icon={MousePointer} title="Button Clicks" value={stats?.clicks ?? 0}
          change={fmtChange(stats?.clicksChange).text} changeType={fmtChange(stats?.clicksChange).type} />
        <KPICard icon={Users} title="New Contacts" value={stats?.contacts ?? 0}
          change={fmtChange(stats?.contactsChange).text} changeType={fmtChange(stats?.contactsChange).type} />
        <KPICard icon={Calendar} title="Bookings" value={stats?.bookings ?? 0}
          change={fmtChange(stats?.bookingsChange).text} changeType={fmtChange(stats?.bookingsChange).type} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map(action => (
          <motion.button
            key={action.label}
            whileHover={{ y: -2 }}
            onClick={() => navigate(action.href)}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <action.icon className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium">{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Row 2: Needs Follow-up + Tasks Due Today */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Follow-up */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <h2 className="font-semibold">Needs Follow-up</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/app/contacts")}>
              View all <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
          {followUpLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : followUpContacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">All caught up! 🎉</p>
          ) : (
            <div className="space-y-2">
              {followUpContacts.slice(0, 5).map(c => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/app/contacts/${c.id}`)}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                    {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${bucketColors[c.bucket]}`}>
                        {c.bucket_label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.stage_name ?? "No stage"}
                      {c.next_activity_at && ` · Due ${formatDistanceToNow(new Date(c.next_activity_at), { addSuffix: true })}`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); navigate(`/app/contacts/${c.id}`); }}>
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Tasks Due Today */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Tasks Due Today ({todayTasks.length})</h2>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/app/tasks")}>
              View all <ArrowUpRight className="h-3 w-3" />
            </Button>
          </div>
          {tasksLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : todayTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No tasks due today.</p>
          ) : (
            <div className="space-y-1">
              {todayTasks.map((task: any) => (
                <div key={task.id} className="flex items-center gap-3 py-2">
                  <button onClick={() => updateTask.mutate({ id: task.id, leadId: task.lead_id, status: "done", title: task.title })}>
                    <Circle className={`h-5 w-5 shrink-0 ${priorityColors[task.priority]}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{task.title}</p>
                    {task.leads?.name && (
                      <button onClick={() => navigate(`/app/contacts/${task.lead_id}`)} className="text-xs text-primary hover:underline">
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
              <p className="text-xs text-muted-foreground mb-2">Coming up</p>
              {upcomingTasks.map((task: any) => (
                <div key={task.id} className="flex items-center gap-3 py-1.5 opacity-70">
                  <Circle className={`h-4 w-4 shrink-0 ${priorityColors[task.priority]}`} />
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
  );
}
