import { Sparkles, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { AIUsageData } from "../hooks/useProviderInsights";

interface Props {
  usage: AIUsageData | null | undefined;
  isLoading?: boolean;
}

export default function AIUsageMeter({ usage, isLoading }: Props) {
  const navigate = useNavigate();

  if (isLoading || !usage) return null;

  const pct = Math.min((usage.used / usage.limit) * 100, 100);
  const remaining = Math.max(usage.limit - usage.used, 0);
  const isNearLimit = pct >= 80;
  const isAtLimit = pct >= 100;

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/30">
      <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">
            {usage.used} of {usage.limit} AI assists used this month
          </span>
          <span className={`text-xs font-medium ${isAtLimit ? "text-destructive" : isNearLimit ? "text-warning" : "text-muted-foreground"}`}>
            {remaining} left
          </span>
        </div>
        <Progress
          value={pct}
          className={`h-1.5 ${isAtLimit ? "[&>div]:bg-destructive" : isNearLimit ? "[&>div]:bg-warning" : ""}`}
        />
      </div>
      {isNearLimit && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 shrink-0"
          onClick={() => navigate("/pricing")}
        >
          <Zap className="h-3 w-3" />
          {isAtLimit ? "Upgrade" : "Get More"}
        </Button>
      )}
    </div>
  );
}
