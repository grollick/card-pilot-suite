import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp, Lightbulb, Loader2, RefreshCw, ArrowUpRight,
  Zap, PenTool, Users, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRevenuePrediction } from "@/hooks/useRevenuePrediction";
import { usePlanLimits } from "@/hooks/usePlanLimits";

type Insight = { title: string; description: string; type: string; action?: string; route?: string };

const typeStyles: Record<string, { icon: typeof Lightbulb; color: string }> = {
  tip: { icon: Lightbulb, color: "text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10" },
  warning: { icon: Zap, color: "text-destructive bg-destructive/10" },
  info: { icon: TrendingUp, color: "text-primary bg-primary/10" },
};

const QUICK_PROMPTS = [
  { label: "Weekly summary", icon: TrendingUp, prompt: "Give me my weekly performance summary" },
  { label: "Get more leads", icon: Users, prompt: "How can I get more leads this week?" },
  { label: "Write content", icon: PenTool, prompt: "Write service descriptions for my top services" },
  { label: "Follow-up help", icon: MessageSquare, prompt: "Draft follow-up messages for my pending leads" },
];

export default function GrowthCoachWidget() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const { planKey } = usePlanLimits();
  const { suggestions } = useRevenuePrediction();

  const { data: insights, isLoading, isFetching } = useQuery({
    queryKey: ["ai-insights", refreshKey],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: {},
      });
      if (error) throw error;
      return (data?.insights ?? []) as Insight[];
    },
  });

  // Merge AI insights with revenue coaching suggestions for richer output
  const coachingInsights: Insight[] = [
    ...(insights ?? []),
    ...suggestions.slice(0, 2).map((s) => ({
      title: s.title,
      description: s.description,
      type: s.priority === "high" ? "warning" : "tip",
      action: s.action,
      route: s.route,
    })),
  ].slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/10 to-[hsl(var(--success))]/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">AI Growth Coach</h2>
            <p className="text-2xs text-muted-foreground">
              {planKey === "starter" ? "Basic tips" : "Personalized coaching"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 h-7"
            disabled={isFetching}
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 h-7"
            onClick={() => navigate("/app/assistant")}
          >
            Open Coach <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="dash-card-body space-y-3">
        {/* Insights */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : coachingInsights.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Share your card and get leads to unlock AI growth tips.
          </p>
        ) : (
          <div className="space-y-1.5">
            {coachingInsights.slice(0, 3).map((insight, i) => {
              const style = typeStyles[insight.type] ?? typeStyles.info;
              const Icon = style.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer"
                  onClick={() => insight.route && navigate(insight.route)}
                >
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${style.color}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{insight.title}</p>
                    <p className="text-2xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                      {insight.description}
                    </p>
                  </div>
                  {insight.action && (
                    <span className="text-2xs text-primary font-medium shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {insight.action} →
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick action buttons */}
        <div className="border-t border-border pt-3">
          <p className="text-2xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Ask your coach</p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_PROMPTS.map((prompt) => (
              <Button
                key={prompt.label}
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 justify-start font-normal"
                onClick={() => navigate("/app/assistant")}
              >
                <prompt.icon className="h-3 w-3 shrink-0 text-muted-foreground" />
                {prompt.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
