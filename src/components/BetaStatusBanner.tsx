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
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          isUrgent
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary"
        }`}>
          <FlaskConical className="h-3 w-3" />
          Beta · {daysLeft <= 0 ? "Expires today" : `${daysLeft}d left`}
        </span>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return null;
}
