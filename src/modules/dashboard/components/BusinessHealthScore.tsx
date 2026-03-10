import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Zap, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useBusinessHealthScore, type HealthFactor } from "@/hooks/useBusinessHealthScore";

function ScoreRing({ score, max }: { score: number; max: number }) {
  const pct = Math.round((score / max) * 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const color =
    pct >= 75 ? "hsl(var(--success))" :
    pct >= 50 ? "hsl(var(--warning))" :
    "hsl(var(--destructive))";

  const bgColor =
    pct >= 75 ? "hsl(var(--success) / 0.1)" :
    pct >= 50 ? "hsl(var(--warning) / 0.1)" :
    "hsl(var(--destructive) / 0.1)";

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.21, 0.47, 0.32, 0.98] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold tabular-nums"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-2xs text-muted-foreground font-medium">/ {max}</span>
      </div>
    </div>
  );
}

function FactorBar({ factor }: { factor: HealthFactor }) {
  const pct = (factor.score / factor.maxScore) * 100;
  const barColor =
    pct >= 75 ? "bg-success" :
    pct >= 50 ? "bg-warning" :
    "bg-destructive";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{factor.label}</span>
        <span className="text-xs text-muted-foreground tabular-nums font-semibold">
          {factor.score} / {factor.maxScore}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      {factor.suggestion && (
        <p className="text-2xs text-muted-foreground leading-relaxed flex items-start gap-1">
          <Zap className="h-3 w-3 text-warning shrink-0 mt-0.5" />
          {factor.suggestion}
        </p>
      )}
    </div>
  );
}

export default function BusinessHealthScore() {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { data, isLoading } = useBusinessHealthScore();

  const pct = data ? Math.round((data.totalScore / data.maxScore) * 100) : 0;
  const label =
    pct >= 80 ? "Excellent" :
    pct >= 65 ? "Good" :
    pct >= 45 ? "Needs Work" :
    "Critical";

  const labelColor =
    pct >= 75 ? "text-success" :
    pct >= 50 ? "text-warning" :
    "text-destructive";

  const TrendIcon = data?.trend != null
    ? data.trend > 0 ? TrendingUp : data.trend < 0 ? TrendingDown : Minus
    : Minus;

  const trendColor = data?.trend != null
    ? data.trend > 0 ? "text-success" : data.trend < 0 ? "text-destructive" : "text-muted-foreground"
    : "text-muted-foreground";

  const suggestions = data?.factors.filter(f => f.suggestion) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Business Health Score</h2>
            {!isLoading && data && (
              <p className={`text-2xs font-medium ${labelColor}`}>{label}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1 h-7"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide" : "Details"}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </div>

      <div className="dash-card-body">
        {isLoading ? (
          <div className="flex flex-col items-center py-4 gap-3">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : data ? (
          <>
            {/* Score ring */}
            <ScoreRing score={data.totalScore} max={data.maxScore} />

            {/* Trend indicator */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
                <TrendIcon className="h-3.5 w-3.5" />
                {data.trend != null && data.trend !== 0 && (
                  <span>{Math.abs(data.trend)}% vs last week</span>
                )}
                {data.trend === 0 && <span>Steady</span>}
              </div>
            </div>

            {/* Top suggestion */}
            {suggestions.length > 0 && !expanded && (
              <div className="mt-3 p-2.5 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium text-foreground">Improve your score: </span>
                    {suggestions[0].suggestion}
                  </span>
                </p>
              </div>
            )}

            {/* Expanded breakdown */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border mt-4 pt-4 space-y-3">
                    <p className="text-2xs text-muted-foreground uppercase tracking-wider font-medium">Score Breakdown</p>
                    {data.factors.map(factor => (
                      <FactorBar key={factor.key} factor={factor} />
                    ))}
                  </div>

                  {suggestions.length > 1 && (
                    <div className="border-t border-border mt-4 pt-3">
                      <p className="text-2xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Improvements</p>
                      <div className="space-y-1.5">
                        {suggestions.map(s => (
                          <div key={s.key} className="flex items-start gap-2 py-1">
                            <Badge variant="outline" className={`text-[10px] shrink-0 ${
                              s.score / s.maxScore >= 0.75 ? "border-success/30 text-success" :
                              s.score / s.maxScore >= 0.5 ? "border-warning/30 text-warning" :
                              "border-destructive/30 text-destructive"
                            }`}>
                              {s.score}/{s.maxScore}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{s.suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : null}
      </div>
    </motion.div>
  );
}
