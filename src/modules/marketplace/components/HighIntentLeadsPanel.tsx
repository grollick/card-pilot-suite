import { motion, AnimatePresence } from "framer-motion";
import { Flame, ArrowRight, MessageSquare, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import LeadScoreBadge from "./LeadScoreBadge";
import { useHighIntentLeads, type LeadScore } from "../hooks/useLeadScoring";

interface Props {
  onViewLead?: (leadId: string) => void;
  onReply?: (leadId: string) => void;
}

export default function HighIntentLeadsPanel({ onViewLead, onReply }: Props) {
  const { data: highLeads, isLoading } = useHighIntentLeads();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-5 w-44 mb-3" />
        <div className="space-y-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!highLeads || highLeads.length === 0) return null;

  return (
    <div className="rounded-xl border border-success/20 bg-success/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-success/10">
        <Flame className="h-4 w-4 text-success" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            {highLeads.length} high-intent lead{highLeads.length !== 1 ? "s" : ""} need a reply
          </p>
          <p className="text-[10px] text-muted-foreground">Focus on these leads first</p>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <AnimatePresence>
          {highLeads.slice(0, 3).map((s: LeadScore) => {
            const lead = s.business_leads;
            const ageH = lead?.created_at
              ? Math.round((Date.now() - new Date(lead.created_at).getTime()) / 3600000)
              : null;

            return (
              <motion.div
                key={s.lead_id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-foreground truncate">
                      {lead?.full_name || "Unknown"}
                    </p>
                    <LeadScoreBadge score={s.score} label={s.label} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {lead?.message || "No message"}
                  </p>
                  {ageH !== null && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{ageH}h ago</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => onViewLead?.(s.lead_id)}
                  >
                    View <ArrowRight className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => onReply?.(s.lead_id)}
                  >
                    <MessageSquare className="h-3 w-3" /> Reply
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
