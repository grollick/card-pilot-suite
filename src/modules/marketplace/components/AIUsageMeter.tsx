import { Sparkles, Zap, TrendingUp } from "lucide-react";
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

  const pct = Math.min((usage.used / Math.max(usage.limit, 1)) * 100, 100);
  const remaining = Math.max(usage.limit - usage.used, 0);
  const isNearLimit = pct >= 80;
  const isAtLimit = pct >= 100;

  // Value-first: show what AI did, not what's left
  const valueMessage = usage.used > 0
    ? `Copilot helped you with ${usage.used} action${usage.used !== 1 ? "s" : ""} this month`
    : "Use Copilot to reply faster and win more jobs";

  return (
    <div className="mx-4 mb-1 rounded-xl bg-muted/40 border border-border overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Value-first icon */}
        {usage.used > 0 ? (
          <div className="h-7 w-7 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          </div>
        ) : (
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          {/* Value message first */}
          <p className="text-xs font-medium text-foreground leading-tight">
            {isAtLimit
              ? "You're getting results with Copilot"
              : valueMessage}
          </p>

          {/* Progress bar — secondary info */}
          <div className="flex items-center gap-2 mt-1.5">
            <Progress
              value={pct}
              className={`h-1 flex-1 ${isAtLimit ? "[&>div]:bg-destructive" : isNearLimit ? "[&>div]:bg-warning" : ""}`}
            />
            <span className={`text-[10px] font-medium shrink-0 ${isAtLimit ? "text-destructive" : isNearLimit ? "text-warning" : "text-muted-foreground"}`}>
              {usage.used}/{usage.limit}
            </span>
          </div>
        </div>

        {/* Upgrade CTA — only when near/at limit */}
        {isAtLimit ? (
          <Button
            size="sm"
            className="h-8 text-xs gap-1 shrink-0"
            onClick={() => navigate("/pricing")}
          >
            <Zap className="h-3 w-3" />
            Upgrade
          </Button>
        ) : isNearLimit ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 shrink-0"
            onClick={() => navigate("/pricing")}
          >
            Get More
          </Button>
        ) : null}
      </div>

      {/* Soft upgrade nudge at limit */}
      {isAtLimit && (
        <div className="px-4 py-2 bg-primary/5 border-t border-primary/10">
          <p className="text-xs text-muted-foreground">
            Upgrade to keep replying faster and winning more jobs
          </p>
        </div>
      )}
    </div>
  );
}
