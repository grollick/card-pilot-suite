import { motion } from "framer-motion";
import { RefreshCw, Loader2, Zap, Target, Clock, Phone, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import LeadScoreBadge from "./LeadScoreBadge";
import { useLeadScore, useScoreLead } from "../hooks/useLeadScoring";

interface Props {
  leadId: string;
}

const factorConfig: Record<string, { label: string; icon: typeof Zap }> = {
  completeness: { label: "Info completeness", icon: Target },
  urgency: { label: "Urgency signals", icon: Zap },
  service_match: { label: "Service match", icon: Wrench },
  recency: { label: "Recency", icon: Clock },
  contact_quality: { label: "Contact quality", icon: Phone },
};

export default function LeadScoreDetail({ leadId }: Props) {
  const { data: score, isLoading } = useLeadScore(leadId);
  const scoreMutation = useScoreLead();

  const handleScore = () => {
    scoreMutation.mutate({ lead_id: leadId });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-5 w-32 mb-3" />
        <Skeleton className="h-16 rounded-xl mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!score) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="text-center py-4">
          <Target className="h-7 w-7 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">No score yet</p>
          <p className="text-xs text-muted-foreground mb-3">
            Score this lead to see how likely they are to convert.
          </p>
          <Button
            size="sm"
            onClick={handleScore}
            disabled={scoreMutation.isPending}
            className="gap-1"
          >
            {scoreMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Zap className="h-3 w-3" />
            )}
            Score Lead
          </Button>
        </div>
      </div>
    );
  }

  const factors = score.scoring_factors || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-semibold text-foreground">Lead Score</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1"
          onClick={handleScore}
          disabled={scoreMutation.isPending}
        >
          {scoreMutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Re-score
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Score badge */}
        <LeadScoreBadge score={score.score} label={score.label} size="md" />

        {/* Explanation */}
        {score.explanation && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {score.explanation}
          </p>
        )}

        {/* Recommended action */}
        {score.recommended_action && (
          <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs font-medium text-primary mb-0.5">Recommended action</p>
            <p className="text-xs text-foreground">{score.recommended_action}</p>
          </div>
        )}

        {/* Scoring factors */}
        {Object.keys(factors).length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Scoring factors</p>
            {Object.entries(factors).map(([key, value]) => {
              const cfg = factorConfig[key];
              if (!cfg || typeof value !== "number") return null;
              const Icon = cfg.icon;
              return (
                <div key={key} className="flex items-center gap-2">
                  <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-[11px] text-muted-foreground w-28 shrink-0">{cfg.label}</span>
                  <Progress value={value} className="h-1.5 flex-1" />
                  <span className="text-[10px] text-muted-foreground w-7 text-right">{value}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
