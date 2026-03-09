import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Loader2, RefreshCw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function AIInsightsWidget() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: insights, isLoading, isFetching } = useQuery({
    queryKey: ["ai-insights", refreshKey],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: {},
      });
      if (error) throw error;
      return (data?.insights ?? []) as { title: string; description: string; type: string }[];
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-[hsl(var(--warning))]" />
          <h2 className="font-semibold">AI Insights</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1"
          disabled={isFetching}
          onClick={() => setRefreshKey(k => k + 1)}
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !insights || insights.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Add more data to unlock AI-powered insights.
        </p>
      ) : (
        <div className="space-y-3">
          {insights.slice(0, 4).map((insight, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="h-6 w-6 rounded-full bg-[hsl(var(--warning))]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="h-3 w-3 text-[hsl(var(--warning))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
