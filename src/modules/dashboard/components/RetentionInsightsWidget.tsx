import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  RefreshCcw, Star, CalendarPlus, Zap, TrendingUp, TrendingDown, Minus,
  ArrowUpRight, Users, Mail, DollarSign, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useRetentionMetrics } from "@/hooks/useRetentionMetrics";

function TrendBadge({ value }: { value: number }) {
  if (value === 0) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
      <Minus className="h-2.5 w-2.5" /> 0%
    </span>
  );
  const pos = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${pos ? "text-success" : "text-destructive"}`}>
      {pos ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {pos ? "+" : ""}{value}%
    </span>
  );
}

function MetricTile({
  icon: Icon, label, value, subtitle, color, delay,
}: {
  icon: typeof Star; label: string; value: string; subtitle?: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-xl bg-muted/40 p-3.5 hover:bg-muted/60 transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-2xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold tracking-tight tabular-nums">{value}</p>
      {subtitle && <p className="text-2xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </motion.div>
  );
}

export default function RetentionInsightsWidget() {
  const navigate = useNavigate();
  const { data, isLoading } = useRetentionMetrics();

  const insights: Array<{ icon: typeof Star; text: string; action: string; route: string; priority: "high" | "medium" }> = [];

  if (data) {
    if (data.rebookingCandidates > 0) {
      insights.push({
        icon: CalendarPlus,
        text: `${data.rebookingCandidates} past client${data.rebookingCandidates > 1 ? "s" : ""} ready to rebook`,
        action: "View",
        route: "/app/contacts",
        priority: "high",
      });
    }
    if (data.pendingReviews > 0) {
      insights.push({
        icon: Star,
        text: `${data.pendingReviews} review${data.pendingReviews > 1 ? "s" : ""} awaiting approval`,
        action: "Review",
        route: "/app/reviews",
        priority: "medium",
      });
    }
    if (data.activeAutomations === 0) {
      insights.push({
        icon: Zap,
        text: "Enable automations to follow up with clients automatically",
        action: "Set up",
        route: "/app/automation",
        priority: "medium",
      });
    }
    if (data.repeatCustomerRate < 20 && data.totalCustomers > 5) {
      insights.push({
        icon: RefreshCcw,
        text: "Boost repeat rate — send rebooking reminders to past clients",
        action: "Promote",
        route: "/app/promotions",
        priority: "medium",
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Retention & Growth</h2>
            <p className="text-2xs text-muted-foreground">Keep clients coming back</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => navigate("/app/analytics")}>
          Details <ArrowUpRight className="h-3 w-3" />
        </Button>
      </div>

      <div className="dash-card-body space-y-4">
        {/* KPI tiles */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <MetricTile
              icon={RefreshCcw}
              label="Repeat Rate"
              value={`${data?.repeatCustomerRate ?? 0}%`}
              subtitle={`${data?.repeatCustomers ?? 0} of ${data?.totalCustomers ?? 0} clients`}
              color="text-primary bg-primary/10"
              delay={0}
            />
            <MetricTile
              icon={Star}
              label="Reviews"
              value={`${data?.reviewsCollected ?? 0}`}
              subtitle={data?.avgRating ? `${data.avgRating} avg rating` : "No reviews yet"}
              color="text-warning bg-warning/10"
              delay={0.05}
            />
            <MetricTile
              icon={Mail}
              label="Follow-ups Sent"
              value={`${data?.followupsSent ?? 0}`}
              subtitle={`${data?.activeAutomations ?? 0} active automations`}
              color="text-success bg-success/10"
              delay={0.1}
            />
            <MetricTile
              icon={DollarSign}
              label="Monthly Revenue"
              value={`$${(data?.monthlyRevenue ?? 0).toLocaleString()}`}
              subtitle={<TrendBadge value={data?.revenueTrend ?? 0} /> as unknown as string}
              color="text-primary bg-primary/10"
              delay={0.15}
            />
          </div>
        )}

        {/* Repeat customer progress */}
        {!isLoading && data && data.totalCustomers > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Repeat customer goal (30%)</span>
              <span className="text-xs font-semibold tabular-nums">{data.repeatCustomerRate}%</span>
            </div>
            <Progress value={Math.min(data.repeatCustomerRate / 30 * 100, 100)} className="h-2" />
          </div>
        )}

        {/* Action insights */}
        {!isLoading && insights.length > 0 && (
          <div className="space-y-1 border-t border-border pt-3">
            <p className="text-2xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Recommended Actions</p>
            {insights.slice(0, 3).map((insight, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
              >
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                  insight.priority === "high" ? "bg-warning/10" : "bg-muted"
                }`}>
                  <insight.icon className={`h-3.5 w-3.5 ${
                    insight.priority === "high" ? "text-warning" : "text-muted-foreground"
                  }`} />
                </div>
                <p className="text-xs text-muted-foreground flex-1">{insight.text}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => navigate(insight.route)}
                >
                  {insight.action}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
