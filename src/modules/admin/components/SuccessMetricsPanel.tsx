import { motion } from "framer-motion";
import {
  Zap, Users, MessageSquare, Clock, Activity,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip";

interface SuccessMetrics {
  activationRate: number;
  firstLeadRate: number;
  responseRate: number;
  avgTimeToActionHours: number;
  dau: number;
  totalActivated: number;
  totalWithLeads: number;
  totalMatches: number;
  totalResponded: number;
}

interface Props {
  metrics?: SuccessMetrics | null;
  totalUsers?: number;
  isLoading: boolean;
}

type Status = "good" | "warning" | "critical";

function getStatus(value: number, good: number, warn: number, invert = false): Status {
  if (invert) {
    if (value <= good) return "good";
    if (value <= warn) return "warning";
    return "critical";
  }
  if (value >= good) return "good";
  if (value >= warn) return "warning";
  return "critical";
}

const statusColors: Record<Status, string> = {
  good: "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10",
  warning: "text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10",
  critical: "text-destructive bg-destructive/10",
};

const statusDotColors: Record<Status, string> = {
  good: "bg-[hsl(var(--success))]",
  warning: "bg-[hsl(var(--warning))]",
  critical: "bg-destructive",
};

const statusLabels: Record<Status, string> = {
  good: "Healthy",
  warning: "Needs attention",
  critical: "Critical",
};

function MetricCard({
  label, value, suffix, description, status, detail, delay,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  description: string;
  status: Status;
  detail?: string;
  delay: number;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            className="rounded-xl border border-border bg-card p-4 hover:shadow-card-hover transition-shadow cursor-default"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${statusDotColors[status]}`} />
                <span className={`text-[10px] font-medium ${statusColors[status].split(" ")[0]}`}>
                  {statusLabels[status]}
                </span>
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight">{value}</span>
              {suffix && <span className="text-sm text-muted-foreground font-medium">{suffix}</span>}
            </div>
            {detail && (
              <p className="text-[11px] text-muted-foreground mt-1">{detail}</p>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px]">
          <p className="text-xs">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function generateInsights(metrics: SuccessMetrics, totalUsers: number): { message: string; type: Status }[] {
  const insights: { message: string; type: Status }[] = [];

  if (metrics.activationRate < 20) {
    insights.push({
      message: "Low activation rate — simplify onboarding or add guided setup prompts.",
      type: "critical",
    });
  } else if (metrics.activationRate < 40) {
    insights.push({
      message: "Activation could improve — consider adding email nudges for incomplete signups.",
      type: "warning",
    });
  }

  if (metrics.firstLeadRate < 30) {
    insights.push({
      message: "Few activated users receive leads — boost marketplace visibility or add discovery features.",
      type: "warning",
    });
  }

  if (metrics.responseRate < 50) {
    insights.push({
      message: "Response rate is below 50% — add push notifications or response reminders.",
      type: "critical",
    });
  }

  if (metrics.dau < totalUsers * 0.05) {
    insights.push({
      message: "Daily active users are low — consider engagement campaigns or daily digest emails.",
      type: "warning",
    });
  }

  if (insights.length === 0) {
    insights.push({
      message: "All metrics are healthy — keep monitoring and optimizing.",
      type: "good",
    });
  }

  return insights;
}

export default function SuccessMetricsPanel({ metrics, totalUsers = 1, isLoading }: Props) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-border bg-card p-5"
      >
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (!metrics) return null;

  const cards = [
    {
      label: "Activation Rate",
      value: metrics.activationRate,
      suffix: "%",
      description: "Users who created & published a card, becoming visible to customers.",
      status: getStatus(metrics.activationRate, 40, 20),
      detail: `${metrics.totalActivated} of ${totalUsers} users`,
    },
    {
      label: "First Lead Rate",
      value: metrics.firstLeadRate,
      suffix: "%",
      description: "Activated users who received at least one lead or interaction.",
      status: getStatus(metrics.firstLeadRate, 50, 25),
      detail: `${metrics.totalWithLeads} users received leads`,
    },
    {
      label: "Response Rate",
      value: metrics.responseRate,
      suffix: "%",
      description: "Percentage of marketplace leads that received a response.",
      status: getStatus(metrics.responseRate, 70, 40),
      detail: `${metrics.totalResponded} of ${metrics.totalMatches} responded`,
    },
    {
      label: "Time to Action",
      value: metrics.avgTimeToActionHours,
      suffix: "hrs",
      description: "Average time from signup to first meaningful action (card publish).",
      status: getStatus(metrics.avgTimeToActionHours, 4, 24, true),
      detail: "From signup to activation",
    },
    {
      label: "Daily Active",
      value: metrics.dau,
      suffix: "",
      description: "Unique users active within the last 24 hours.",
      status: getStatus(metrics.dau, Math.max(totalUsers * 0.1, 2), Math.max(totalUsers * 0.03, 1)),
      detail: `${totalUsers > 0 ? Math.round((metrics.dau / totalUsers) * 100) : 0}% of total users`,
    },
  ];

  const insights = generateInsights(metrics, totalUsers);

  const insightIcons: Record<Status, typeof CheckCircle2> = {
    good: CheckCircle2,
    warning: AlertTriangle,
    critical: AlertTriangle,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-primary" />
          <h2 className="font-semibold">Success Metrics</h2>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[240px]">
              <p className="text-xs">Key indicators of platform health and user engagement. Green = healthy, yellow = needs attention, red = critical.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((card, i) => (
          <MetricCard key={card.label} {...card} delay={0.15 + i * 0.05} />
        ))}
      </div>

      {/* Insights */}
      <div className="mt-4 space-y-2">
        {insights.map((insight, i) => {
          const Icon = insightIcons[insight.type];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className={`flex items-start gap-2 p-2.5 rounded-lg ${statusColors[insight.type]}`}
            >
              <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <p className="text-xs font-medium">{insight.message}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
