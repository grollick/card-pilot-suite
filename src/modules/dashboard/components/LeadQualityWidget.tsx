import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLeadRoutingLog } from "@/hooks/useLeadRouting";
import { Flame, TrendingUp, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

function QualityTierBadge({ score }: { score: number }) {
  if (score >= 80) {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 gap-1 text-[10px]">
        <Flame className="h-2.5 w-2.5" /> High Quality
      </Badge>
    );
  }
  if (score >= 60) {
    return (
      <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400 gap-1 text-[10px]">
        <TrendingUp className="h-2.5 w-2.5" /> Medium
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 text-[10px]">
      <Clock className="h-2.5 w-2.5" /> Low
    </Badge>
  );
}

export default function LeadQualityWidget() {
  const { data: log } = useLeadRoutingLog();

  const leads = (log ?? []).filter((l) => (l as any).lead_quality_score > 0);

  if (leads.length === 0) return null;

  const highCount = leads.filter((l) => (l as any).lead_quality_score >= 80).length;
  const medCount = leads.filter((l) => {
    const s = (l as any).lead_quality_score;
    return s >= 60 && s < 80;
  }).length;
  const lowCount = leads.filter((l) => (l as any).lead_quality_score < 60).length;
  const avgScore = Math.round(leads.reduce((sum, l) => sum + ((l as any).lead_quality_score || 0), 0) / leads.length);
  const recentLeads = leads.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Lead Quality Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Average score */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Avg. Quality Score</span>
            <span className="text-lg font-bold text-foreground">{avgScore}<span className="text-xs text-muted-foreground">/100</span></span>
          </div>
          <Progress value={avgScore} className="h-2" />

          {/* Tier breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2">
              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{highCount}</div>
              <div className="text-[10px] text-muted-foreground">High (80+)</div>
            </div>
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-2">
              <div className="text-lg font-bold text-amber-700 dark:text-amber-400">{medCount}</div>
              <div className="text-[10px] text-muted-foreground">Medium (60–79)</div>
            </div>
            <div className="rounded-lg bg-muted/50 border border-border p-2">
              <div className="text-lg font-bold text-muted-foreground">{lowCount}</div>
              <div className="text-[10px] text-muted-foreground">Low (&lt;60)</div>
            </div>
          </div>

          {/* Recent scored leads */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Recent Leads</h4>
            {recentLeads.map((lead) => {
              const score = (lead as any).lead_quality_score || 0;
              return (
                <div key={lead.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <QualityTierBadge score={score} />
                    <span className="text-xs text-foreground truncate max-w-[120px]">
                      {lead.status === "converted" ? "Converted" : lead.status === "responded" ? "Responded" : "Delivered"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Progress value={score} className="h-1.5 w-12" />
                    <span className="text-xs font-medium text-foreground w-7 text-right">{score}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendation */}
          {highCount > 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-xs text-foreground">
              <span className="font-medium">💡 Tip:</span> You have {highCount} high-quality lead{highCount > 1 ? "s" : ""}. Respond quickly for the best conversion rate!
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
