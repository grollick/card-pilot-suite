import { CheckCircle2, X, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useEstimateMatches } from "@/hooks/useEstimateRequests";
import { formatDistanceToNow } from "date-fns";

export default function DutyMatchesList() {
  const { matches, respondToMatch } = useEstimateMatches();
  const pendingMatches = matches.filter(m => m.status === "pending");

  if (pendingMatches.length === 0) {
    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground text-center py-4">
            No pending estimate requests
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      <div className="border-t border-border pt-3 space-y-2">
        {pendingMatches.slice(0, 5).map((match) => {
          const req = match.estimate_request;
          const deadline = match.response_deadline_at
            ? formatDistanceToNow(new Date(match.response_deadline_at), { addSuffix: true })
            : null;

          return (
            <div
              key={match.id}
              className="rounded-lg border border-border/60 p-3 space-y-2 bg-background/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium truncate">
                      {req?.requester_name ?? "Unknown"}
                    </span>
                  </div>
                  {req?.service_needed && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {req.service_needed}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0 gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {deadline ?? "No deadline"}
                </Badge>
              </div>

              {req?.budget && (
                <p className="text-[10px] text-muted-foreground">
                  Budget: {req.budget} {req.timeline ? `• ${req.timeline}` : ""}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-7 text-xs gap-1"
                  onClick={() => respondToMatch.mutate({ matchId: match.id, action: "accepted" })}
                  disabled={respondToMatch.isPending}
                >
                  <CheckCircle2 className="h-3 w-3" /> Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs gap-1"
                  onClick={() => respondToMatch.mutate({ matchId: match.id, action: "declined" })}
                  disabled={respondToMatch.isPending}
                >
                  <X className="h-3 w-3" /> Decline
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
