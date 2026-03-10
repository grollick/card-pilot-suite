import { useNavigate } from "react-router-dom";
import {
  Eye, UserPlus, CalendarCheck, DollarSign, FileText, Briefcase,
  TrendingUp, TrendingDown, Minus, ArrowUpRight, MessageSquare, Plus,
  CalendarPlus, Bell, AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useDailyScorecard } from "@/hooks/useDailyScorecard";

function TrendBadge({ value, label }: { value: number; label: string }) {
  if (value === 0) return (
    <span className="inline-flex items-center gap-0.5 text-2xs text-muted-foreground font-medium">
      <Minus className="h-2.5 w-2.5" /> {label}
    </span>
  );
  const positive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-2xs font-medium ${positive ? "text-success" : "text-destructive"}`}>
      {positive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {positive ? "+" : ""}{value}% {label}
    </span>
  );
}

export default function DailyScorecard() {
  const navigate = useNavigate();
  const { data, isLoading } = useDailyScorecard();

  const metrics = [
    { label: "Card Views", value: data?.views ?? 0, icon: Eye, trend: data?.trends?.views ?? 0 },
    { label: "New Leads", value: data?.leads ?? 0, icon: UserPlus, trend: data?.trends?.leads ?? 0 },
    { label: "Bookings", value: data?.bookings ?? 0, icon: CalendarCheck, trend: data?.trends?.bookings ?? 0 },
    { label: "Estimates Sent", value: data?.estimatesSent ?? 0, icon: FileText, trend: data?.trends?.estimates ?? 0 },
    { label: "Jobs Done", value: data?.jobsCompleted ?? 0, icon: Briefcase, trend: data?.trends?.jobs ?? 0 },
    { label: "Est. Revenue", value: `$${(data?.revenue ?? 0).toLocaleString()}`, icon: DollarSign, trend: data?.trends?.revenue ?? 0 },
  ];

  const insights = data?.insights ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card"
    >
      {/* Header */}
      <div className="dash-card-header">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Yesterday's Business Summary</h2>
            <p className="text-2xs text-muted-foreground">Daily scorecard & action items</p>
          </div>
        </div>
        {!isLoading && (data?.followupsNeeded ?? 0) > 0 && (
          <Badge variant="outline" className="text-2xs border-warning/30 text-warning bg-warning/5 gap-1">
            <Bell className="h-2.5 w-2.5" />
            {data!.followupsNeeded} follow-ups
          </Badge>
        )}
      </div>

      <div className="dash-card-body space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {metrics.map(item => (
            <div key={item.label} className="text-center py-2.5 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center mx-auto mb-1.5">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-10 mx-auto" />
              ) : (
                <p className="text-lg font-bold tracking-tight tabular-nums">{item.value}</p>
              )}
              <p className="text-2xs text-muted-foreground mt-0.5 font-medium">{item.label}</p>
              {!isLoading && <TrendBadge value={item.trend} label="vs prior" />}
            </div>
          ))}
        </div>

        {/* Actionable Insights */}
        {!isLoading && insights.length > 0 && (
          <div className="border-t border-border pt-3 space-y-1.5">
            <p className="text-2xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Actionable Insights</p>
            {insights.map((insight, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 group">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                  insight.severity === "high" ? "bg-destructive/10 text-destructive" :
                  insight.severity === "medium" ? "bg-warning/10 text-warning" :
                  "bg-primary/10 text-primary"
                }`}>
                  <AlertCircle className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm flex-1 min-w-0">{insight.message}</p>
                <div className="flex gap-1 shrink-0">
                  {insight.action === "follow_up" && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/app/contacts")}>
                      <MessageSquare className="h-3 w-3" /> Follow Up
                    </Button>
                  )}
                  {insight.action === "send_message" && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/app/contacts")}>
                      <MessageSquare className="h-3 w-3" /> Message
                    </Button>
                  )}
                  {insight.action === "create_task" && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/app/tasks")}>
                      <Plus className="h-3 w-3" /> Task
                    </Button>
                  )}
                  {insight.action === "book" && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/app/bookings")}>
                      <CalendarPlus className="h-3 w-3" /> Book
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
