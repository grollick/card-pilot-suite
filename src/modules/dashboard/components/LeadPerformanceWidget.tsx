import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadPerformance, type PerformanceBadge, type PerformanceInsight } from "@/hooks/useLeadPerformance";
import { motion } from "framer-motion";
import { Zap, Trophy, Star, Clock, TrendingUp, AlertTriangle, Lightbulb, CheckCircle2, Target } from "lucide-react";

const BADGE_ICONS: Record<string, typeof Zap> = {
  zap: Zap,
  trophy: Trophy,
  star: Star,
  clock: Clock,
};

const INSIGHT_STYLES: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  success: { icon: CheckCircle2, color: "text-success" },
  warning: { icon: AlertTriangle, color: "text-amber-500" },
  tip: { icon: Lightbulb, color: "text-primary" },
};

function BadgeChip({ badge }: { badge: PerformanceBadge }) {
  const Icon = BADGE_ICONS[badge.icon] || Star;
  if (!badge.earned) return null;
  return (
    <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 text-primary py-1 px-2.5">
      <Icon className="h-3 w-3" />
      {badge.label}
    </Badge>
  );
}

function InsightRow({ insight }: { insight: PerformanceInsight }) {
  const style = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.tip;
  const Icon = style.icon;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${style.color}`} />
      <span className="text-foreground/80">{insight.message}</span>
    </div>
  );
}

export default function LeadPerformanceWidget() {
  const { data, isLoading } = useLeadPerformance();

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (!data || data.totalMatches === 0) {
    return null; // Don't show until user has matches
  }

  const earnedBadges = data.badges.filter((b) => b.earned);

  const formatResponseTime = (mins: number | null) => {
    if (mins === null) return "—";
    if (mins < 60) return `${mins}m`;
    return `${Math.round(mins / 60)}h`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Lead Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Leads Won", value: data.totalWon, highlight: true },
              { label: "Win Rate", value: `${data.winRate}%` },
              { label: "Response Rate", value: `${data.responseRate}%` },
              { label: "Avg Response", value: formatResponseTime(data.avgResponseMinutes) },
            ].map((kpi) => (
              <div key={kpi.label} className="text-center p-3 rounded-lg bg-muted/50">
                <p className={`text-xl font-bold ${kpi.highlight ? "text-primary" : "text-foreground"}`}>{kpi.value}</p>
                <p className="text-2xs text-muted-foreground mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Badges */}
          {earnedBadges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map((badge) => (
                <BadgeChip key={badge.key} badge={badge} />
              ))}
            </div>
          )}

          {/* Insights */}
          {data.insights.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" /> Insights
              </p>
              {data.insights.slice(0, 3).map((insight, i) => (
                <InsightRow key={i} insight={insight} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
