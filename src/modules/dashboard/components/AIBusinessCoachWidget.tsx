import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, TrendingUp, Lightbulb, AlertTriangle, Target, BarChart3,
  Loader2, RefreshCw, ArrowUpRight, CheckCircle2, Clock, Zap,
  MessageSquare, ChevronRight, Calendar, Trophy, Eye, Users, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface DailyTask {
  task: string;
  priority: "high" | "medium" | "low";
  reason: string;
  route?: string;
}

interface Insight {
  title: string;
  description: string;
  type: "tip" | "warning" | "info" | "opportunity";
}

interface Opportunity {
  title: string;
  description: string;
  potential_impact: "high" | "medium" | "low";
}

interface Warning {
  title: string;
  description: string;
  type: string;
}

interface Performance {
  views: number;
  leads: number;
  bookings: number;
  revenue: number;
  conversion_rate: number;
  avg_rating?: string;
  total_leads?: number;
  estimates_pending?: number;
}

interface WeeklySummary {
  headline: string;
  wins: string[];
  focus_areas: string[];
}

interface CoachData {
  daily_plan?: DailyTask[];
  insights?: Insight[];
  tips?: string[];
  opportunities?: Opportunity[];
  warnings?: Warning[];
  performance?: Performance;
  weekly_summary?: WeeklySummary;
}

type Tab = "plan" | "insights" | "performance" | "weekly";

const tabs: { key: Tab; label: string; icon: typeof Sparkles }[] = [
  { key: "plan", label: "Today", icon: Target },
  { key: "insights", label: "Insights", icon: Lightbulb },
  { key: "performance", label: "Stats", icon: BarChart3 },
  { key: "weekly", label: "Weekly", icon: Calendar },
];

const priorityStyles = {
  high: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  medium: { bg: "bg-[hsl(var(--warning))]/10", text: "text-[hsl(var(--warning))]", dot: "bg-[hsl(var(--warning))]" },
  low: { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary" },
};

const insightTypeStyles: Record<string, { icon: typeof Lightbulb; color: string }> = {
  tip: { icon: Lightbulb, color: "text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10" },
  warning: { icon: AlertTriangle, color: "text-destructive bg-destructive/10" },
  info: { icon: TrendingUp, color: "text-primary bg-primary/10" },
  opportunity: { icon: Target, color: "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10" },
};

const impactStyles = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  low: "bg-primary/10 text-primary",
};

export default function AIBusinessCoachWidget() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("plan");
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: coach, isLoading, isFetching } = useQuery<CoachData>({
    queryKey: ["ai-business-coach", refreshKey],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-business-coach");
      if (error) throw error;
      return data as CoachData;
    },
  });

  const dailyPlan = coach?.daily_plan ?? [];
  const insights = coach?.insights ?? [];
  const tips = coach?.tips ?? [];
  const opportunities = coach?.opportunities ?? [];
  const warnings = coach?.warnings ?? [];
  const performance = coach?.performance;
  const weekly = coach?.weekly_summary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card"
    >
      {/* Header */}
      <div className="dash-card-header">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/15 to-[hsl(var(--success))]/15 flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm flex items-center gap-1.5">
              AI Business Coach
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-medium text-primary border-primary/20">
                Live
              </Badge>
            </h2>
            <p className="text-2xs text-muted-foreground">Your daily growth advisor</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 h-7"
            disabled={isFetching}
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 h-7"
            onClick={() => navigate("/app/assistant")}
          >
            Chat <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-1">
        <div className="flex gap-0.5 bg-muted/40 rounded-lg p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-[11px] font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="dash-card-body">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "plan" && (
                <DailyPlanTab
                  tasks={dailyPlan}
                  warnings={warnings}
                  navigate={navigate}
                />
              )}
              {activeTab === "insights" && (
                <InsightsTab
                  insights={insights}
                  tips={tips}
                  opportunities={opportunities}
                  navigate={navigate}
                />
              )}
              {activeTab === "performance" && (
                <PerformanceTab performance={performance} />
              )}
              {activeTab === "weekly" && (
                <WeeklyTab summary={weekly} navigate={navigate} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Ask Coach Footer */}
      <div className="px-4 pb-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs gap-1.5 rounded-lg"
          onClick={() => navigate("/app/assistant")}
        >
          <MessageSquare className="h-3 w-3" />
          Ask your coach a question
        </Button>
      </div>
    </motion.div>
  );
}

/* ──── Daily Plan Tab ──── */
function DailyPlanTab({ tasks, warnings, navigate }: { tasks: DailyTask[]; warnings: Warning[]; navigate: (path: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        Today's Action Plan
      </p>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No tasks generated yet. Click refresh to get your daily plan.
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task, i) => {
            const style = priorityStyles[task.priority] ?? priorityStyles.low;
            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-xl ${style.bg} cursor-pointer hover:brightness-95 transition-all group`}
                onClick={() => task.route && navigate(task.route)}
              >
                <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${style.bg}`}>
                  <div className={`h-2 w-2 rounded-full ${style.dot}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{task.task}</p>
                  <p className="text-2xs text-muted-foreground mt-0.5">{task.reason}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 group-hover:text-foreground/60 transition-colors mt-1" />
              </div>
            );
          })}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive/60 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Needs Attention
          </p>
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5">
              <Zap className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-destructive">{w.title}</p>
                <p className="text-2xs text-muted-foreground">{w.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──── Insights Tab ──── */
function InsightsTab({ insights, tips, opportunities, navigate }: {
  insights: Insight[];
  tips: string[];
  opportunities: Opportunity[];
  navigate: (path: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Data Insights */}
      {insights.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Insights</p>
          {insights.map((insight, i) => {
            const style = insightTypeStyles[insight.type] ?? insightTypeStyles.info;
            const Icon = style.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${style.color}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{insight.title}</p>
                  <p className="text-2xs text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Growth Tips */}
      {tips.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-[hsl(var(--warning))]" />
            Quick Tips
          </p>
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[hsl(var(--warning))]/5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--warning))] shrink-0 mt-0.5" />
              <p className="text-xs text-foreground leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      )}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1">
            <Target className="h-3 w-3 text-[hsl(var(--success))]" />
            Opportunities
          </p>
          {opportunities.map((opp, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[hsl(var(--success))]/5 hover:bg-[hsl(var(--success))]/10 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-tight">{opp.title}</p>
                  <Badge variant="outline" className={`text-[8px] h-3.5 px-1 ${impactStyles[opp.potential_impact]}`}>
                    {opp.potential_impact}
                  </Badge>
                </div>
                <p className="text-2xs text-muted-foreground mt-0.5">{opp.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──── Performance Tab ──── */
function PerformanceTab({ performance }: { performance?: Performance }) {
  if (!performance) {
    return <p className="text-sm text-muted-foreground text-center py-6">No performance data yet.</p>;
  }

  const stats = [
    { label: "Card Views", value: performance.views, icon: Eye, color: "text-primary" },
    { label: "New Leads", value: performance.leads, icon: Users, color: "text-[hsl(var(--success))]" },
    { label: "Bookings", value: performance.bookings, icon: Calendar, color: "text-[hsl(var(--warning))]" },
    { label: "Revenue", value: `$${performance.revenue.toFixed(0)}`, icon: DollarSign, color: "text-[hsl(var(--success))]" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">This Week</p>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              <span className="text-[10px] text-muted-foreground font-medium">{stat.label}</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Additional metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between py-1.5 border-b border-border/30">
          <span className="text-xs text-muted-foreground">Conversion Rate</span>
          <span className="text-xs font-semibold tabular-nums">{performance.conversion_rate}%</span>
        </div>
        {performance.avg_rating && performance.avg_rating !== "N/A" && (
          <div className="flex items-center justify-between py-1.5 border-b border-border/30">
            <span className="text-xs text-muted-foreground">Avg Rating</span>
            <span className="text-xs font-semibold tabular-nums">⭐ {performance.avg_rating}</span>
          </div>
        )}
        {(performance.estimates_pending ?? 0) > 0 && (
          <div className="flex items-center justify-between py-1.5 border-b border-border/30">
            <span className="text-xs text-muted-foreground">Pending Estimates</span>
            <Badge variant="outline" className="text-[10px] h-4 bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20">
              {performance.estimates_pending}
            </Badge>
          </div>
        )}
        {(performance.total_leads ?? 0) > 0 && (
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">Total Leads (All Time)</span>
            <span className="text-xs font-semibold tabular-nums">{performance.total_leads}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──── Weekly Summary Tab ──── */
function WeeklyTab({ summary, navigate }: { summary?: WeeklySummary | null; navigate: (path: string) => void }) {
  if (!summary) {
    return (
      <div className="text-center py-8 space-y-2">
        <Trophy className="h-8 w-8 text-muted-foreground/30 mx-auto" />
        <p className="text-sm text-muted-foreground">Weekly summary will appear once you have more activity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Headline */}
      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-[hsl(var(--success))]/10 p-4">
        <p className="text-sm font-semibold">{summary.headline}</p>
      </div>

      {/* Wins */}
      {summary.wins.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--success))]/60 flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            Wins
          </p>
          {summary.wins.map((win, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[hsl(var(--success))]/5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))] shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{win}</p>
            </div>
          ))}
        </div>
      )}

      {/* Focus Areas */}
      {summary.focus_areas.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--warning))]/60 flex items-center gap-1">
            <Target className="h-3 w-3" />
            Focus This Week
          </p>
          {summary.focus_areas.map((area, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[hsl(var(--warning))]/5">
              <Clock className="h-3.5 w-3.5 text-[hsl(var(--warning))] shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{area}</p>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs gap-1.5 h-8 rounded-lg"
        onClick={() => navigate("/app/analytics")}
      >
        <BarChart3 className="h-3 w-3" />
        View Full Analytics
      </Button>
    </div>
  );
}
