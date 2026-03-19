import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, AlertTriangle, TrendingUp, ThumbsUp, ChevronDown, ChevronUp,
  Loader2, RefreshCw, ArrowUpRight, Wrench, CheckCircle2, Zap,
  BarChart3, Target, Calendar, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useBusinessHealthScore } from "@/hooks/useBusinessHealthScore";
import { useDashboardStats } from "@/hooks/useDashboardStats";

type InsightType = "problem" | "opportunity" | "positive" | "warning" | "tip" | "info";

interface Insight {
  title: string;
  description: string;
  type: string;
  action?: string;
  route?: string;
}

const typeConfig: Record<string, { icon: typeof AlertTriangle; badge: string; badgeClass: string; cardClass: string }> = {
  problem: {
    icon: AlertTriangle,
    badge: "Fix This",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
    cardClass: "border-l-destructive/60",
  },
  warning: {
    icon: AlertTriangle,
    badge: "Fix This",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
    cardClass: "border-l-destructive/60",
  },
  opportunity: {
    icon: TrendingUp,
    badge: "Apply",
    badgeClass: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
    cardClass: "border-l-primary/60",
  },
  tip: {
    icon: TrendingUp,
    badge: "Apply",
    badgeClass: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
    cardClass: "border-l-primary/60",
  },
  positive: {
    icon: ThumbsUp,
    badge: "Keep Going",
    badgeClass: "bg-success/10 text-success border-success/20",
    cardClass: "border-l-success/60",
  },
  info: {
    icon: ThumbsUp,
    badge: "Keep Going",
    badgeClass: "bg-success/10 text-success border-success/20",
    cardClass: "border-l-success/60",
  },
};

function WeeklyReportSummary() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: health } = useBusinessHealthScore();

  if (isLoading) return <Skeleton className="h-28 w-full rounded-xl" />;

  const healthPct = health ? Math.round((health.totalScore / health.maxScore) * 100) : 0;
  const tips = health?.factors.filter(f => f.suggestion).slice(0, 3) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/30 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly Performance</h4>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Leads", value: stats?.leadsToday ?? 0, icon: Target },
            { label: "Bookings", value: stats?.bookingsWeek ?? 0, icon: Calendar },
            { label: "Health", value: `${healthPct}%`, icon: Sparkles },
          ].map((m) => (
            <div key={m.label} className="text-center p-2.5 rounded-lg bg-muted/40">
              <m.icon className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold tabular-nums text-foreground">{m.value}</p>
              <p className="text-2xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {tips.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-2xs font-medium text-muted-foreground uppercase tracking-wider">Top improvements</p>
            {tips.map((t) => (
              <div key={t.key} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3 text-warning shrink-0 mt-0.5" />
                <span>{t.suggestion}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AIGrowthAssistantPanel() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const { data: insights, isLoading, isFetching } = useQuery({
    queryKey: ["ai-insights", refreshKey],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: {},
      });
      if (error) throw error;
      return (data?.insights ?? []) as Insight[];
    },
  });

  const categorized = {
    problem: insights?.filter((i) => i.type === "problem" || i.type === "warning") ?? [],
    opportunity: insights?.filter((i) => i.type === "opportunity" || i.type === "tip") ?? [],
    positive: insights?.filter((i) => i.type === "positive" || i.type === "info") ?? [],
  };

  const allInsights = [...categorized.problem, ...categorized.opportunity, ...categorized.positive];
  const visibleInsights = expanded ? allInsights : allInsights.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card relative overflow-hidden"
    >
      {/* Subtle gradient accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-success rounded-t-xl" />

      {/* Header */}
      <div className="dash-card-header pt-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center ring-1 ring-primary/10">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm flex items-center gap-1.5">
              AI Growth Assistant
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal border-primary/20 text-primary">
                Live
              </Badge>
            </h2>
            <p className="text-2xs text-muted-foreground">
              {allInsights.length > 0
                ? `${categorized.problem.length} issue${categorized.problem.length !== 1 ? "s" : ""} · ${categorized.opportunity.length} tip${categorized.opportunity.length !== 1 ? "s" : ""}`
                : "Analyzing your business…"}
            </p>
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
            Full Coach <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Insight Cards */}
      <div className="dash-card-body space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : allInsights.length === 0 ? (
          <div className="text-center py-6">
            <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Share your card and get leads to unlock AI insights.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {visibleInsights.map((insight, i) => {
                  const insightType = insight.type || "opportunity";

                  const config = typeConfig[insightType] ?? typeConfig.opportunity;
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={`${insight.title}-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className={`flex items-start gap-3 p-3 rounded-xl border-l-[3px] bg-muted/25 hover:bg-muted/40 transition-all duration-200 group ${config.cardClass}`}
                    >
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        insightType === "problem" ? "bg-destructive/10" :
                        insightType === "opportunity" ? "bg-primary/10" :
                        "bg-success/10"
                      }`}>
                        <Icon className={`h-3.5 w-3.5 ${
                          insightType === "problem" ? "text-destructive" :
                          insightType === "opportunity" ? "text-primary" :
                          "text-success"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{insight.title}</p>
                        <p className="text-2xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                          {insight.description}
                        </p>
                      </div>
                      {insightType !== "positive" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-7 text-[10px] font-medium px-2.5 shrink-0 transition-colors ${config.badgeClass}`}
                          onClick={() => {
                            if (insight.route) navigate(insight.route);
                            else navigate("/app/assistant");
                          }}
                        >
                          {insightType === "problem" ? (
                            <><Wrench className="h-3 w-3 mr-1" />Fix This</>
                          ) : (
                            <><CheckCircle2 className="h-3 w-3 mr-1" />Apply</>
                          )}
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Expand/Collapse */}
            {allInsights.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <><ChevronUp className="h-3 w-3" /> Show less</>
                ) : (
                  <><ChevronDown className="h-3 w-3" /> Show {allInsights.length - 3} more insights</>
                )}
              </Button>
            )}
          </>
        )}

        {/* Weekly Report Toggle */}
        <div className="border-t border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-2 h-9 font-medium"
            onClick={() => setShowReport(!showReport)}
          >
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            {showReport ? "Hide Weekly Report" : "View Weekly Report"}
            {showReport ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>

          <AnimatePresence>
            {showReport && (
              <div className="mt-3">
                <WeeklyReportSummary />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Actions */}
        <div className="border-t border-border pt-3">
          <p className="text-2xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Quick actions</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "Weekly summary", icon: BarChart3, route: "/app/assistant" },
              { label: "Get more leads", icon: Target, route: "/app/assistant" },
              { label: "Follow-up help", icon: MessageSquare, route: "/app/assistant" },
              { label: "Full assistant", icon: Sparkles, route: "/app/assistant" },
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 justify-start font-normal"
                onClick={() => navigate(action.route)}
              >
                <action.icon className="h-3 w-3 shrink-0 text-muted-foreground" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
