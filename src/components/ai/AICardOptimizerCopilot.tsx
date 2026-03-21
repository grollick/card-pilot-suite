import { Sparkles, Loader2, ArrowRight, TrendingUp, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAICardOptimizer } from "@/hooks/useAICopilot";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

const priorityColors = {
  high: "border-destructive/20 bg-destructive/5",
  medium: "border-warning/20 bg-warning/5",
  low: "border-primary/20 bg-primary/5",
};

const priorityDot = {
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-primary",
};

export default function AICardOptimizerCopilot() {
  const { data, isLoading, isFetching } = useAICardOptimizer();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-semibold">AI Card Optimizer</h3>
          <p className="text-[10px] text-muted-foreground">Suggestions to improve your conversion rate</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={isFetching}
          onClick={() => queryClient.invalidateQueries({ queryKey: ["ai-card-optimizer"] })}
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Analyzing your card...</span>
        </div>
      ) : (
        <>
          {/* Score bar */}
          {data?.overall_score != null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Card Quality Score</span>
                <span className="text-xs font-bold text-primary">{data.overall_score}/100</span>
              </div>
              <Progress
                value={data.overall_score}
                className="h-1.5 bg-primary/10 [&>div]:bg-primary"
              />
            </div>
          )}

          {/* Suggestions */}
          {data?.suggestions?.length ? (
            <div className="space-y-2">
              {data.suggestions.slice(0, 4).map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`rounded-lg border p-2.5 ${priorityColors[s.priority]}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${priorityDot[s.priority]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{s.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{s.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-primary flex items-center gap-0.5">
                          <TrendingUp className="h-2.5 w-2.5" /> {s.impact}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] px-1.5 gap-1 text-primary hover:text-primary"
                          onClick={() => navigate("/app/card")}
                        >
                          Fix now <ArrowRight className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              Your card looks great! Keep it up.
            </p>
          )}
        </>
      )}
    </motion.div>
  );
}
