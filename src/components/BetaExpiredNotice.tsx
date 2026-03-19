import { FlaskConical, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

/**
 * Friendly notice shown when beta has expired.
 * Placed inline in settings or as a dismissible card.
 */
export default function BetaExpiredNotice({ onDismiss }: { onDismiss?: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Beta Access Ended</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Your beta access has ended. Your account is now on the Free plan.{" "}
        <strong>All your data is still here</strong> and can be reactivated by upgrading.
      </p>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => navigate("/app/settings/billing")}>
          <ArrowRight className="h-3 w-3 mr-1" /> View Plans
        </Button>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
}
