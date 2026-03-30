import { motion } from "framer-motion";
import { RefreshCw, Loader2, Zap, Target, Clock, Phone, Wrench, Sparkles, Bot } from "lucide-react";
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
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="text-center py-4 space-y-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">How strong is this lead?</p>
            <p className="text-xs text-muted-foreground mt-1">
              Copilot will analyze this lead and tell you what to do next
            </p>
          </div>
          <Button
            size="default"
            onClick={handleScore}
            disabled={scoreMutation.isPending}
            className="gap-1.5 h-10"
          >
            {scoreMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Score This Lead
          </Button>
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <Bot className="h-2.5 w-2.5" /> Suggested by Copilot
          </p>
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
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-xs font-semibold text-foreground">Lead Score</span>
          <span className="text-[10px] text-muted-foreground">by Copilot</span>
        </div>
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

        {/* AI summary — "What this customer wants" */}
        {score.explanation && (
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              AI Summary
            </p>
            <p className="text-xs text-foreground leading-relaxed">
              {score.explanation}
            </p>
          </div>
        )}

        {/* Recommended action — prominent */}
        {score.recommended_action && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-0.5">
              What to do next
            </p>
            <p className="text-sm font-medium text-foreground">{score.recommended_action}</p>
          </div>
        )}

        {/* Scoring factors — compact */}
        {Object.keys(factors).length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Why this score
            </p>
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
