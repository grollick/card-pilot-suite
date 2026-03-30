import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, MessageSquare, Users, Star, UserCheck, ImagePlus,
  ArrowRight, Loader2, CheckCircle2, Sparkles, RefreshCw, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProviderInsights, useProviderBusiness, useAIUsage,
  useStaleLeads, usePendingBookings, useCompletedBookings,
  useUpdateSuggestion, useSavedSuggestions,
  type AISuggestion,
} from "../hooks/useProviderInsights";
import AIUsageMeter from "./AIUsageMeter";
import AIUpgradeModal from "./AIUpgradeModal";

const typeConfig: Record<string, { icon: typeof Bot; color: string; actionLabel: string }> = {
  lead_reply: { icon: MessageSquare, color: "text-primary", actionLabel: "Reply to Lead" },
  follow_up: { icon: Clock, color: "text-warning", actionLabel: "Send Follow-up" },
  review_request: { icon: Star, color: "text-warning", actionLabel: "Request Review" },
  profile_improve: { icon: ImagePlus, color: "text-success", actionLabel: "Improve Profile" },
  booking_confirm: { icon: UserCheck, color: "text-primary", actionLabel: "Confirm Booking" },
};

const priorityBadge: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

interface Props {
  onAction?: (suggestion: AISuggestion) => void;
}

/** Derive simple suggestions from live data when AI hasn't run */
function deriveSuggestions(
  staleLeads: any[],
  pendingBookings: any[],
  completedBookings: any[],
): AISuggestion[] {
  const derived: AISuggestion[] = [];

  staleLeads.slice(0, 3).forEach((l) => {
    const ageH = Math.round((Date.now() - new Date(l.created_at).getTime()) / 3600000);
    derived.push({
      type: "follow_up",
      title: `Follow up with ${l.full_name}`,
      description: `This lead has been waiting ${ageH}h without a response. Send a follow-up to avoid losing this opportunity.`,
      priority: ageH > 48 ? "high" : "medium",
      leadId: l.lead_id,
    });
  });

  pendingBookings.slice(0, 2).forEach((b) => {
    derived.push({
      type: "booking_confirm",
      title: `Confirm booking with ${b.customer_name}`,
      description: `Booking on ${b.booking_date}${b.booking_time ? ` at ${b.booking_time}` : ""} is pending confirmation.`,
      priority: "medium",
      bookingId: b.booking_id,
    });
  });

  completedBookings.slice(0, 2).forEach((b) => {
    derived.push({
      type: "review_request",
      title: `Ask ${b.customer_name} for a review`,
      description: `Booking completed on ${b.booking_date}. Ask for a review to boost your marketplace ranking.`,
      priority: "medium",
      bookingId: b.booking_id,
    });
  });

  return derived.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
  }).slice(0, 5);
}

export default function AIInsightsPanel({ onAction }: Props) {
  const { data: business } = useProviderBusiness();
  const businessId = business?.id;

  const { data: aiSuggestions, isLoading: aiLoading, refetch, isFetching } = useProviderInsights();
  const { data: staleLeads = [], isLoading: staleLoading } = useStaleLeads(businessId);
  const { data: pendingBookings = [], isLoading: pendingLoading } = usePendingBookings(businessId);
  const { data: completedBookings = [], isLoading: completedLoading } = useCompletedBookings(businessId);
  const updateSuggestion = useUpdateSuggestion();

  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const isLoading = aiLoading || staleLoading || pendingLoading || completedLoading;

  // Merge: use AI suggestions if available, otherwise derive from live data
  const derivedSuggestions = deriveSuggestions(staleLeads, pendingBookings, completedBookings);
  const allSuggestions = (aiSuggestions && aiSuggestions.length > 0) ? aiSuggestions : derivedSuggestions;
  const visible = allSuggestions.filter((_, i) => !dismissed.has(i));

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">AI Assistant</h2>
            <p className="text-[10px] text-muted-foreground">
              {business?.business_name ? `Suggestions for ${business.business_name}` : "Actionable suggestions for your business"}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { setDismissed(new Set()); refetch(); }}
          disabled={isFetching}
          className="h-8 text-xs gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Live data summary */}
      {(staleLeads.length > 0 || pendingBookings.length > 0) && (
        <div className="px-5 py-2 bg-warning/5 border-b border-warning/10 flex items-center gap-3 text-xs text-warning">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>
            {staleLeads.length > 0 && `${staleLeads.length} lead${staleLeads.length > 1 ? "s" : ""} awaiting response`}
            {staleLeads.length > 0 && pendingBookings.length > 0 && " · "}
            {pendingBookings.length > 0 && `${pendingBookings.length} pending booking${pendingBookings.length > 1 ? "s" : ""}`}
          </span>
        </div>
      )}

      {/* Suggestions */}
      <div className="p-4">
        <AnimatePresence mode="popLayout">
          {visible.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">You're in good shape!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Keep sharing your card and responding quickly to leads.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {visible.map((s, idx) => {
                const originalIdx = allSuggestions.indexOf(s);
                const cfg = typeConfig[s.type] || typeConfig.lead_reply;
                const Icon = cfg.icon;

                return (
                  <motion.div
                    key={`${s.type}-${originalIdx}-${s.leadId || s.bookingId || idx}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/20 transition-all group"
                  >
                    <div className={`mt-0.5 h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityBadge[s.priority]}`}>
                          {s.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => onAction?.(s)}
                        >
                          {cfg.actionLabel}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                        <button
                          onClick={() => setDismissed(prev => new Set([...prev, originalIdx]))}
                          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
