import { RefreshCw, Zap, CalendarCheck, Star, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAutomationRuns } from "@/hooks/useRevenueOpportunities";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface ContactAutomationPanelProps {
  contactId: string;
  contactName: string;
  contactEmail?: string | null;
  lastBookingDate?: string | null;
  lastActivityDate?: string | null;
}

export default function ContactAutomationPanel({
  contactId,
  contactName,
  contactEmail,
  lastBookingDate,
  lastActivityDate,
}: ContactAutomationPanelProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: runs = [], isLoading } = useAutomationRuns(contactId);
  const [sending, setSending] = useState<string | null>(null);

  const now = new Date();
  const daysSinceBooking = lastBookingDate
    ? Math.floor((now.getTime() - new Date(lastBookingDate).getTime()) / 86400000)
    : null;
  const daysSinceActivity = lastActivityDate
    ? Math.floor((now.getTime() - new Date(lastActivityDate).getTime()) / 86400000)
    : null;

  const rebookEligible = daysSinceBooking !== null && daysSinceBooking >= 30;
  const winbackEligible = daysSinceActivity !== null && daysSinceActivity >= 60;

  const handleManualAction = async (actionType: string, title: string) => {
    if (!user) return;
    setSending(actionType);
    try {
      await supabase.from("contact_activities").insert({
        user_id: user.id,
        lead_id: contactId,
        activity_type: actionType,
        title,
        occurred_at: new Date().toISOString(),
      });
      qc.invalidateQueries({ queryKey: ["contact-activities"] });
      qc.invalidateQueries({ queryKey: ["automation-runs", contactId] });
      toast.success(`${title} logged`);
    } catch {
      toast.error("Action failed");
    } finally {
      setSending(null);
    }
  };

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    executed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    failed: "bg-destructive/10 text-destructive",
    skipped: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-4">
      {/* Eligibility badges */}
      <div className="flex flex-wrap gap-2">
        {rebookEligible && (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0">
            <CalendarCheck className="h-3 w-3 mr-1" />
            Ready to rebook ({daysSinceBooking}d ago)
          </Badge>
        )}
        {winbackEligible && (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0">
            <RefreshCw className="h-3 w-3 mr-1" />
            Win-back eligible ({daysSinceActivity}d inactive)
          </Badge>
        )}
        {!rebookEligible && !winbackEligible && (
          <Badge variant="secondary" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Active customer
          </Badge>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={sending === "review_request_sent"}
          onClick={() => handleManualAction("review_request_sent", "Review request sent")}
        >
          {sending === "review_request_sent" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Star className="h-3 w-3 mr-1" />}
          Request Review
        </Button>
        {rebookEligible && (
          <Button
            size="sm"
            variant="outline"
            disabled={sending === "rebook_reminder_sent"}
            onClick={() => handleManualAction("rebook_reminder_sent", "Rebooking reminder sent")}
          >
            {sending === "rebook_reminder_sent" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CalendarCheck className="h-3 w-3 mr-1" />}
            Send Rebooking Reminder
          </Button>
        )}
        {winbackEligible && (
          <Button
            size="sm"
            variant="outline"
            disabled={sending === "winback_sent"}
            onClick={() => handleManualAction("winback_sent", "Win-back promotion sent")}
          >
            {sending === "winback_sent" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
            Send Win-Back Offer
          </Button>
        )}
      </div>

      {/* Automation history */}
      {runs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Automation History
          </h4>
          <div className="space-y-1">
            {runs.slice(0, 8).map((run: any) => {
              const rule = run.automation_rules;
              return (
                <div key={run.id} className="flex items-center gap-2 text-xs p-2 rounded-md bg-muted/30">
                  <Zap className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">
                    {rule?.trigger_type ?? "automation"} → {rule?.action_type ?? "action"}
                  </span>
                  <Badge variant="outline" className={`text-2xs ${statusColors[run.status] ?? ""}`}>
                    {run.status}
                  </Badge>
                  <span className="text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
