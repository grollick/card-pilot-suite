import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  ArrowRight, Bell, Shield, Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminFunnelStats, type FunnelStage } from "@/hooks/useAdminFunnelStats";

// ── Threshold definitions ──
interface Threshold {
  green: number;   // >= this is green
  yellow: number;  // >= this is yellow, below is red
}

const stageThresholds: Record<string, Threshold> = {
  "leads-replies":           { green: 30, yellow: 15 },
  "replies-signups":         { green: 40, yellow: 20 },
  "signups-activated":       { green: 50, yellow: 25 },
  "activated-first_lead":    { green: 30, yellow: 15 },
  "first_lead-first_response": { green: 50, yellow: 25 },
  "first_response-first_job":  { green: 40, yellow: 20 },
};

type HealthStatus = "green" | "yellow" | "red";

function getStatus(rate: number, key: string): HealthStatus {
  const t = stageThresholds[key];
  if (!t) return rate >= 50 ? "green" : rate >= 20 ? "yellow" : "red";
  if (rate >= t.green) return "green";
  if (rate >= t.yellow) return "yellow";
  return "red";
}

const statusConfig: Record<HealthStatus, { label: string; bg: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
  green: {
    label: "Strong",
    bg: "bg-[hsl(var(--success))]/10",
    text: "text-[hsl(var(--success))]",
    border: "border-[hsl(var(--success))]/20",
    icon: CheckCircle2,
  },
  yellow: {
    label: "Moderate",
    bg: "bg-[hsl(var(--warning))]/10",
    text: "text-[hsl(var(--warning))]",
    border: "border-[hsl(var(--warning))]/20",
    icon: AlertTriangle,
  },
  red: {
    label: "Critical",
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/20",
    icon: AlertTriangle,
  },
};

const stageLabels: Record<string, [string, string]> = {
  "leads-replies": ["Leads", "Replies"],
  "replies-signups": ["Replies", "Signups"],
  "signups-activated": ["Signups", "Activated"],
  "activated-first_lead": ["Activated", "First Lead"],
  "first_lead-first_response": ["First Lead", "First Response"],
  "first_response-first_job": ["First Response", "First Job"],
};

interface StageMetric {
  key: string;
  from: string;
  to: string;
  rate: number;
  status: HealthStatus;
  fromCount: number;
  toCount: number;
}

interface Props {
  compact?: boolean;
}

export default function FunnelHealthMonitor({ compact = false }: Props) {
  const { data: current, isLoading: currentLoading } = useAdminFunnelStats(30);
  const { data: previous, isLoading: prevLoading } = useAdminFunnelStats(60);

  const loading = currentLoading || prevLoading;

  const metrics = useMemo<StageMetric[]>(() => {
    if (!current?.stages) return [];
    const stages = current.stages;
    const result: StageMetric[] = [];

    for (let i = 1; i < stages.length; i++) {
      const prev = stages[i - 1];
      const curr = stages[i];
      const key = `${prev.id}-${curr.id}`;
      const rate = prev.count > 0 ? (curr.count / prev.count) * 100 : 0;
      result.push({
        key,
        from: prev.label,
        to: curr.label,
        rate,
        status: getStatus(rate, key),
        fromCount: prev.count,
        toCount: curr.count,
      });
    }
    return result;
  }, [current]);

  // Weekly trends: compare current 30d vs previous 30d (from 60d data)
  const trends = useMemo(() => {
    if (!current?.stages || !previous?.stages) return {};
    const trendMap: Record<string, number> = {};
    const currStages = current.stages;
    const prevStages = previous.stages;

    for (let i = 1; i < currStages.length; i++) {
      const currPrev = currStages[i - 1];
      const currCurr = currStages[i];
      const key = `${currPrev.id}-${currCurr.id}`;
      const currRate = currPrev.count > 0 ? (currCurr.count / currPrev.count) * 100 : 0;

      const pPrev = prevStages.find(s => s.id === currPrev.id);
      const pCurr = prevStages.find(s => s.id === currCurr.id);
      if (pPrev && pCurr) {
        const prevRate = pPrev.count > 0 ? (pCurr.count / pPrev.count) * 100 : 0;
        trendMap[key] = currRate - prevRate;
      }
    }
    return trendMap;
  }, [current, previous]);

  const alerts = metrics.filter(m => m.status === "red");
  const primaryIssue = alerts[0] || null;
  const overallHealth: HealthStatus = alerts.length > 0 ? "red" : metrics.some(m => m.status === "yellow") ? "yellow" : "green";
  const overallConfig = statusConfig[overallHealth];

  if (compact) {
    return (
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Funnel Health</span>
            </div>
            <Badge variant="outline" className={`text-[10px] ${overallConfig.bg} ${overallConfig.text} ${overallConfig.border}`}>
              <overallConfig.icon className="h-2.5 w-2.5 mr-1" />
              {overallConfig.label}
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-full" />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {metrics.slice(0, 6).map((m) => {
                  const cfg = statusConfig[m.status];
                  return (
                    <div key={m.key} className={`rounded-lg border p-2 text-center ${cfg.bg} ${cfg.border}`}>
                      <p className={`text-lg font-bold tabular-nums ${cfg.text}`}>{m.rate.toFixed(0)}%</p>
                      <p className="text-[8px] text-muted-foreground leading-tight mt-0.5">{m.from} → {m.to}</p>
                    </div>
                  );
                })}
              </div>

              {primaryIssue && (
                <div className="mt-3 flex items-start gap-2 text-xs p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                  <Bell className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium">Priority fix:</span> {primaryIssue.from} → {primaryIssue.to} ({primaryIssue.rate.toFixed(0)}%)
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Health */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-semibold">Platform Health</h3>
                <p className="text-xs text-muted-foreground">
                  {alerts.length === 0 ? "All stages performing well" : `${alerts.length} stage${alerts.length > 1 ? "s" : ""} need${alerts.length === 1 ? "s" : ""} attention`}
                </p>
              </div>
            </div>
            <Badge className={`${overallConfig.bg} ${overallConfig.text} ${overallConfig.border} border`}>
              <overallConfig.icon className="h-3 w-3 mr-1" />
              {overallConfig.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stage Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading
          ? [1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
          : metrics.map((m, idx) => {
              const cfg = statusConfig[m.status];
              const StatusIcon = cfg.icon;
              const trend = trends[m.key];
              const hasTrend = trend !== undefined && !isNaN(trend);

              return (
                <motion.div
                  key={m.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`border ${cfg.border} ${m.status === "red" ? "ring-1 ring-destructive/20" : ""}`}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{m.from}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span>{m.to}</span>
                        </div>
                        <Badge variant="outline" className={`text-[9px] ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <StatusIcon className="h-2 w-2 mr-0.5" />
                          {cfg.label}
                        </Badge>
                      </div>

                      <div className="flex items-end justify-between">
                        <p className={`text-3xl font-bold tabular-nums ${cfg.text}`}>
                          {m.rate.toFixed(0)}%
                        </p>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">
                            {m.toCount.toLocaleString()} / {m.fromCount.toLocaleString()}
                          </p>
                          {hasTrend && (
                            <div className={`flex items-center gap-0.5 text-[10px] font-medium mt-0.5 ${
                              trend > 0 ? "text-[hsl(var(--success))]" : trend < 0 ? "text-destructive" : "text-muted-foreground"
                            }`}>
                              {trend > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : trend < 0 ? <TrendingDown className="h-2.5 w-2.5" /> : <Minus className="h-2.5 w-2.5" />}
                              {trend > 0 ? "+" : ""}{trend.toFixed(1)}pp
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Threshold bar */}
                      <div className="mt-2 h-1.5 rounded-full bg-muted/60 overflow-hidden relative">
                        <motion.div
                          className={`h-full rounded-full ${
                            m.status === "green" ? "bg-[hsl(var(--success))]" :
                            m.status === "yellow" ? "bg-[hsl(var(--warning))]" :
                            "bg-destructive"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(m.rate, 100)}%` }}
                          transition={{ duration: 0.7, ease: "easeOut", delay: idx * 0.05 }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
      </div>

      {/* Alerts */}
      {!loading && alerts.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <Bell className="h-4 w-4" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((a, i) => (
              <div
                key={a.key}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  i === 0 ? "bg-destructive/10 border-destructive/20 ring-1 ring-destructive/10" : "bg-destructive/5 border-destructive/10"
                }`}
              >
                <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${i === 0 ? "text-destructive" : "text-destructive/70"}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {a.from} → {a.to}
                    </p>
                    {i === 0 && (
                      <Badge variant="destructive" className="text-[9px]">Priority Fix</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Only {a.rate.toFixed(1)}% conversion ({a.toCount} of {a.fromCount}).
                    {i === 0 ? " This is the first failing stage — fix this first for maximum impact." : " Address after the priority issue."}
                  </p>
                </div>
                <span className="text-lg font-bold tabular-nums text-destructive">{a.rate.toFixed(0)}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Priority recommendation */}
      {!loading && primaryIssue && (
        <Card className="border-primary/20">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Recommended Focus</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The <span className="font-medium text-foreground">{primaryIssue.from} → {primaryIssue.to}</span> stage
                  has the lowest conversion ({primaryIssue.rate.toFixed(1)}%). Improving this stage will have the
                  highest impact on overall funnel performance since it's the first bottleneck.
                </p>
                {getSuggestion(primaryIssue.key) && (
                  <p className="text-xs text-primary mt-1.5 font-medium">
                    💡 {getSuggestion(primaryIssue.key)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Green */}
      {!loading && alerts.length === 0 && metrics.length > 0 && (
        <Card className="border-[hsl(var(--success))]/20">
          <CardContent className="pt-5 pb-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-[hsl(var(--success))] mx-auto mb-2" />
            <p className="text-sm font-semibold">All Stages Healthy</p>
            <p className="text-xs text-muted-foreground mt-1">
              No critical issues detected. Keep monitoring for changes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getSuggestion(key: string): string | null {
  const suggestions: Record<string, string> = {
    "leads-replies": "Personalize outreach messages and follow up within 24 hours.",
    "replies-signups": "Simplify the signup flow and highlight key benefits.",
    "signups-activated": "Improve onboarding with guided steps, templates, and AI card builder.",
    "activated-first_lead": "Boost marketplace visibility and encourage social sharing.",
    "first_lead-first_response": "Enable push notifications and auto-reminders for new leads.",
    "first_response-first_job": "Add follow-up automation and help users close their first deal.",
  };
  return suggestions[key] || null;
}
