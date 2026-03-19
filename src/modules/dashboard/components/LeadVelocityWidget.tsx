import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLeadVelocity } from "@/hooks/useLeadVelocity";
import { Rocket, TrendingUp, TrendingDown, Minus, Zap, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function VelocityGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(200, score));
  const percentage = (clamped / 200) * 100;
  const color = clamped >= 130 ? "text-emerald-600 dark:text-emerald-400" :
    clamped >= 100 ? "text-primary" :
    clamped >= 70 ? "text-amber-600 dark:text-amber-400" :
    "text-destructive";

  return (
    <div className="flex flex-col items-center">
      <div className={`text-3xl font-bold ${color}`}>{score}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">Velocity Score</div>
      <Progress value={percentage} className="h-1.5 w-24 mt-1.5" />
    </div>
  );
}

export default function LeadVelocityWidget() {
  const { data } = useLeadVelocity();
  const navigate = useNavigate();

  if (!data) return null;

  const {
    velocityScore,
    leadsThisWeek,
    weekOverWeekTrend,
    weeklyGoal,
    multipliers,
    recommendations,
    totalBoost,
  } = data;

  const activeMultipliers = multipliers.filter((m) => m.active);
  const TrendIcon = weekOverWeekTrend > 0 ? TrendingUp : weekOverWeekTrend < 0 ? TrendingDown : Minus;
  const trendColor = weekOverWeekTrend > 0 ? "text-emerald-600 dark:text-emerald-400" :
    weekOverWeekTrend < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" />
              Lead Velocity
            </span>
            {totalBoost > 1 && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                <Zap className="h-2.5 w-2.5 mr-0.5" />
                {Math.round((totalBoost - 1) * 100)}% Boost
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Score & Trend Row */}
          <div className="flex items-center justify-between">
            <VelocityGauge score={velocityScore} />
            <div className="text-right space-y-1">
              <div className="text-xs text-muted-foreground">This week</div>
              <div className="text-2xl font-bold text-foreground">{leadsThisWeek}</div>
              <div className={`flex items-center gap-1 text-xs font-medium justify-end ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                {weekOverWeekTrend > 0 ? "+" : ""}{weekOverWeekTrend}% WoW
              </div>
            </div>
          </div>

          {/* Weekly Goal */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-foreground">Weekly Goal</span>
              <span className="text-muted-foreground">{weeklyGoal.current}/{weeklyGoal.target} leads</span>
            </div>
            <Progress value={weeklyGoal.progress} className="h-2" />
            {weeklyGoal.progress >= 100 && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">🎉 Goal achieved! Keep the momentum going.</p>
            )}
          </div>

          {/* Active Multipliers */}
          {activeMultipliers.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Active Boosts</h4>
              <div className="flex flex-wrap gap-1.5">
                {activeMultipliers.map((m) => (
                  <Badge
                    key={m.key}
                    variant="secondary"
                    className="text-[10px] gap-1 bg-primary/5 border-primary/10 text-foreground"
                    title={m.description}
                  >
                    <Zap className="h-2 w-2 text-primary" />
                    {m.label} +{Math.round((m.value - 1) * 100)}%
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Grow Faster</h4>
              {recommendations.slice(0, 3).map((rec, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-xs rounded-lg p-2 ${
                    rec.priority === "high"
                      ? "bg-primary/5 border border-primary/10"
                      : "bg-muted/30"
                  }`}
                >
                  <span className="flex-shrink-0 mt-0.5">{rec.icon}</span>
                  <span className="text-foreground flex-1">{rec.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => navigate("/app/card")}
            className="w-full flex items-center justify-between rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/10 p-2.5 text-xs font-medium text-primary transition-colors"
          >
            <span>Update your card to boost velocity</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
