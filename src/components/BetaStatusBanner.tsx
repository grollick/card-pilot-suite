import { differenceInDays, format } from "date-fns";
import { FlaskConical, X } from "lucide-react";
import { useState } from "react";
import { useMyBetaAccess } from "@/hooks/useBetaAccess";
import { PLAN_TIERS } from "@/lib/plans";
import { Button } from "@/components/ui/button";

/**
 * Shows a banner when the user has active beta access, with expiry info.
 * Also shows a post-expiry message when beta recently ended.
 */
export default function BetaStatusBanner() {
  const { data: beta, isLoading } = useMyBetaAccess();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || dismissed) return null;

  // Active beta
  if (beta && beta.is_active && new Date(beta.expiry_date) > new Date()) {
    const daysLeft = differenceInDays(new Date(beta.expiry_date), new Date());
    const planLabel = PLAN_TIERS.find((p) => p.key === beta.granted_plan)?.name ?? beta.granted_plan;
    const isUrgent = daysLeft <= 7;

    return (
      <div
        className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm border ${
          isUrgent
            ? "bg-destructive/10 border-destructive/20 text-destructive"
            : "bg-primary/10 border-primary/20 text-primary"
        }`}
      >
        <FlaskConical className="h-4 w-4 shrink-0" />
        <div className="flex-1">
          <span className="font-medium">Beta Access — {planLabel}</span>
          <span className="ml-2 text-xs opacity-80">
            {daysLeft <= 0
              ? "Expires today"
              : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining (until ${format(
                  new Date(beta.expiry_date),
                  "MMM d, yyyy"
                )})`}
          </span>
          {isUrgent && (
            <span className="ml-2 text-xs">
              · Your data will be preserved when beta ends
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => setDismissed(true)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return null;
}
