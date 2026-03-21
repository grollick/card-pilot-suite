import { Sparkles, Flame, Sun, Snowflake, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type LeadScore } from "@/hooks/useAICopilot";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const tierConfig = {
  hot: { icon: Flame, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: "Hot" },
  warm: { icon: Sun, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", label: "Warm" },
  cold: { icon: Snowflake, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", label: "Cold" },
};

export function LeadScoreBadge({ score, compact }: { score: LeadScore; compact?: boolean }) {
  const config = tierConfig[score.tier] || tierConfig.warm;
  const Icon = config.icon;

  if (compact) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${config.bg} ${config.color} border ${config.border}`}>
              <Icon className="h-2.5 w-2.5" />
              {score.score}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <div className="space-y-1">
              <p className="font-medium text-xs">{config.label} Lead — {score.score}/100</p>
              <p className="text-xs text-muted-foreground">{score.reason}</p>
              {score.suggested_action && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <ArrowRight className="h-2.5 w-2.5" /> {score.suggested_action}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${config.bg} border ${config.border}`}
    >
      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
          <span className="text-[10px] text-muted-foreground">{score.score}/100</span>
        </div>
        <p className="text-[10px] text-muted-foreground truncate">{score.reason}</p>
      </div>
    </motion.div>
  );
}

export function LeadScoreLoading() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-muted/50">
      <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground" />
    </span>
  );
}
