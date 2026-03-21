import { useMemo } from "react";
import { isThisWeek } from "date-fns";
import {
  ClipboardList, AlertTriangle, Users, ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useInterviews,
  useInterviewInsights,
  useInterviewCandidates,
  CANDIDATE_GROUPS,
  INSIGHT_CATEGORIES,
  type InsightCategory,
} from "@/hooks/useUserResearch";

const CATEGORY_LABELS: Record<InsightCategory, string> = {
  onboarding: "Onboarding", card_editor: "Card Editor", marketplace: "Marketplace",
  social: "Social", estimates: "Estimates", invoices: "Invoices",
  confusing: "Confusing", high_value: "High Value", churn_risk: "Churn Risk",
};

export default function ResearchSummaryWidget({ onNavigate }: { onNavigate?: () => void }) {
  const { data: interviews = [] } = useInterviews();
  const { data: insights = [] } = useInterviewInsights();
  const { data: candidates = [] } = useInterviewCandidates();

  const weeklyCompleted = interviews.filter(
    i => i.status === "completed" && isThisWeek(new Date(i.interview_date))
  ).length;

  const topIssues = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of insights) {
      counts[i.category] = (counts[i.category] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [insights]);

  const toInterview = candidates.length - interviews.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            User Research
          </CardTitle>
          {onNavigate && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onNavigate}>
              View <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-lg font-bold tabular-nums">{weeklyCompleted}</p>
            <p className="text-[10px] text-muted-foreground">This Week</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-lg font-bold tabular-nums">{insights.filter(i => i.action_status === "new").length}</p>
            <p className="text-[10px] text-muted-foreground">Open Issues</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-lg font-bold tabular-nums">{Math.max(0, toInterview)}</p>
            <p className="text-[10px] text-muted-foreground">To Interview</p>
          </div>
        </div>

        {topIssues.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Top Repeated Issues
            </p>
            <div className="space-y-1">
              {topIssues.map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-[10px]">{CATEGORY_LABELS[cat as InsightCategory] || cat}</Badge>
                  <span className="text-muted-foreground">{count} mentions</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
