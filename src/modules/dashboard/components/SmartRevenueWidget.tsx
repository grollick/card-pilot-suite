import { useNavigate } from "react-router-dom";
import {
  DollarSign, TrendingUp, FileText, Users, Share2,
  CalendarCheck, MessageSquare, Star, ArrowUpRight, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRevenuePrediction, type CoachingSuggestion } from "@/hooks/useRevenuePrediction";

const iconMap: Record<string, typeof DollarSign> = {
  estimate: FileText,
  lead: Users,
  card: Share2,
  booking: CalendarCheck,
  followup: MessageSquare,
  review: Star,
};

const priorityStyles: Record<string, string> = {
  high: "border-l-destructive bg-destructive/5",
  medium: "border-l-[hsl(var(--warning))] bg-[hsl(var(--warning))]/5",
  low: "border-l-primary bg-primary/5",
};

const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function SmartRevenueWidget() {
  const navigate = useNavigate();
  const prediction = useRevenuePrediction();

  const {
    collectedRevenue, projectedRevenue, pipelineValue,
    unpaidValue, estimateConversionRate, daysRemaining,
    suggestions, showPrediction, showAdvancedInsights, planKey,
  } = prediction;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/10 to-[hsl(var(--success))]/10 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Revenue & Coaching</h2>
            <p className="text-2xs text-muted-foreground">{daysRemaining} days left this month</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1 h-7"
          onClick={() => navigate("/app/revenue-forecast")}
        >
          Details <ArrowUpRight className="h-3 w-3" />
        </Button>
      </div>

      <div className="dash-card-body space-y-4">
        {/* Revenue meters */}
        <div className="grid grid-cols-2 gap-3">
          <RevenueMeter
            label="Collected"
            value={collectedRevenue}
            color="hsl(var(--success))"
            max={Math.max(projectedRevenue, collectedRevenue, 1)}
          />
          {showPrediction ? (
            <RevenueMeter
              label="Projected"
              value={projectedRevenue}
              color="hsl(var(--primary))"
              max={Math.max(projectedRevenue, collectedRevenue, 1)}
            />
          ) : (
            <div className="rounded-xl bg-muted/30 p-3 flex flex-col items-center justify-center text-center">
              <Lock className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-2xs text-muted-foreground">Upgrade to Pro for revenue predictions</p>
            </div>
          )}
        </div>

        {/* Quick stats */}
        {showAdvancedInsights && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Pipeline", value: fmt(pipelineValue) },
              { label: "Unpaid", value: fmt(unpaidValue) },
              { label: "Conv. Rate", value: `${estimateConversionRate}%` },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-2 rounded-lg bg-muted/30">
                <p className="text-xs font-bold">{stat.value}</p>
                <p className="text-2xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Coaching suggestions */}
        {suggestions.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-2xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Smart suggestions
            </p>
            <div className="space-y-1.5">
              {suggestions.slice(0, 3).map((suggestion) => (
                <SuggestionRow key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          </div>
        )}

        {/* Upgrade nudge for free users */}
        {planKey === "starter" && suggestions.length > 2 && (
          <div className="text-center pt-1">
            <Button
              variant="link"
              size="sm"
              className="text-2xs text-primary"
              onClick={() => navigate("/app/settings?tab=billing")}
            >
              Upgrade for more coaching insights →
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RevenueMeter({ label, value, color, max }: {
  label: string;
  value: number;
  color: string;
  max: number;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="rounded-xl bg-muted/30 p-3">
      <p className="text-2xs text-muted-foreground font-medium mb-1">{label}</p>
      <p className="text-xl font-bold tracking-tight">{fmt(value)}</p>
      <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function SuggestionRow({ suggestion }: { suggestion: CoachingSuggestion }) {
  const navigate = useNavigate();
  const Icon = iconMap[suggestion.icon] ?? TrendingUp;

  return (
    <button
      onClick={() => navigate(suggestion.route)}
      className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl border-l-2 transition-colors hover:brightness-95 text-left ${priorityStyles[suggestion.priority]}`}
    >
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-tight">{suggestion.title}</p>
        <p className="text-2xs text-muted-foreground mt-0.5 line-clamp-1">{suggestion.description}</p>
      </div>
      <span className="text-2xs text-primary font-medium shrink-0">{suggestion.action}</span>
    </button>
  );
}
