import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Loader2, RefreshCw, ArrowRight, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Insight {
  title: string;
  description: string;
  type: string;
  action_label?: string;
  action_route?: string;
}

const typeIcon = (type: string) => {
  if (type === "warning") return <AlertTriangle className="h-3 w-3 text-destructive" />;
  if (type === "info") return <Info className="h-3 w-3 text-primary" />;
  return <Lightbulb className="h-3 w-3 text-warning" />;
};

const typeBg = (type: string) => {
  if (type === "warning") return "bg-destructive/10";
  if (type === "info") return "bg-primary/10";
  return "bg-warning/10";
};

export default function AIInsightsWidget() {
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="dash-card"
    >
      <div className="dash-card-header">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-warning/10 flex items-center justify-center">
            <Lightbulb className="h-3.5 w-3.5 text-warning" />
          </div>
          <h2 className="font-semibold text-sm">AI Insights</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1 h-7"
          disabled={isFetching}
          onClick={() => setRefreshKey(k => k + 1)}
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="dash-card-body">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !insights || insights.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Add more data to unlock AI-powered insights.
          </p>
        ) : (
          <div className="space-y-2">
            {insights.slice(0, 4).map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className={`h-6 w-6 rounded-lg ${typeBg(insight.type)} flex items-center justify-center shrink-0 mt-0.5`}>
                  {typeIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
                  {insight.action_label && insight.action_route && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 text-xs gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                      onClick={() => navigate(insight.action_route!)}
                    >
                      {insight.action_label}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
