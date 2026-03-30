import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, MessageSquare, Users, Star, UserCheck, ImagePlus,
  ArrowRight, CheckCircle2, Sparkles, RefreshCw, Clock,
  Flame, Share2, CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProviderInsights, useProviderBusiness, useAIUsage,
  useStaleLeads, usePendingBookings, useCompletedBookings,
  type AISuggestion,
} from "../hooks/useProviderInsights";
import { useHighIntentLeads } from "../hooks/useLeadScoring";
import AIUsageMeter from "./AIUsageMeter";

const typeConfig: Record<string, { icon: typeof Bot; color: string; bg: string; actionLabel: string }> = {
  lead_reply:     { icon: Flame,         color: "text-destructive", bg: "bg-destructive/10", actionLabel: "Reply Now" },
  follow_up:      { icon: Clock,         color: "text-warning",     bg: "bg-warning/10",     actionLabel: "Follow Up" },
  review_request: { icon: Star,          color: "text-warning",     bg: "bg-warning/10",     actionLabel: "Request Review" },
  profile_improve:{ icon: ImagePlus,     color: "text-success",     bg: "bg-success/10",     actionLabel: "Improve Profile" },
  booking_confirm:{ icon: CalendarCheck, color: "text-primary",     bg: "bg-primary/10",     actionLabel: "Confirm" },
  new_lead:       { icon: MessageSquare, color: "text-primary",     bg: "bg-primary/10",     actionLabel: "Reply Now" },
};

const urgencyStyles: Record<string, { dot: string; label: string }> = {
  high:   { dot: "bg-destructive",       label: "Urgent" },
  medium: { dot: "bg-warning",           label: "Soon" },
  low:    { dot: "bg-muted-foreground",  label: "When ready" },
};

interface Props {
  onAction?: (suggestion: AISuggestion) => void;
}

/** Build a sorted priority stack from all live data sources */
function buildPriorityStack(
  highIntentLeads: any[],
  staleLeads: any[],
  pendingBookings: any[],
  completedBookings: any[],
  aiSuggestions: AISuggestion[],
): AISuggestion[] {
  const stack: AISuggestion[] = [];
  const seenLeadIds = new Set<string>();

  // 1. High-intent leads needing reply (HIGHEST PRIORITY)
  highIntentLeads.slice(0, 3).forEach((s) => {
    const lead = s.business_leads;
    if (!lead || seenLeadIds.has(s.lead_id)) return;
    seenLeadIds.add(s.lead_id);
    const ageH = lead.created_at
      ? Math.round((Date.now() - new Date(lead.created_at).getTime()) / 3600000)
      : 0;
    stack.push({
      type: "lead_reply",
      title: `${lead.full_name} is a hot lead`,
      description: lead.message
        ? `"${lead.message.slice(0, 80)}${lead.message.length > 80 ? "…" : ""}"`
        : `Score ${s.score} — reply quickly to win this job`,
      priority: "high",
      leadId: s.lead_id,
    });
  });

  // 2. Stale leads needing follow-up
  staleLeads.slice(0, 3).forEach((l) => {
    if (seenLeadIds.has(l.lead_id)) return;
    seenLeadIds.add(l.lead_id);
    const ageH = Math.round((Date.now() - new Date(l.created_at).getTime()) / 3600000);
    stack.push({
      type: "follow_up",
      title: `Follow up with ${l.full_name}`,
      description: ageH > 48
        ? `Waiting ${Math.round(ageH / 24)}d — this lead may go cold`
        : `Waiting ${ageH}h — send a quick follow-up`,
      priority: ageH > 48 ? "high" : "medium",
      leadId: l.lead_id,
    });
  });

  // 3. Pending bookings
  pendingBookings.slice(0, 2).forEach((b) => {
    stack.push({
      type: "booking_confirm",
      title: `Confirm ${b.customer_name}'s booking`,
      description: `${b.booking_date}${b.booking_time ? ` at ${b.booking_time}` : ""} — pending your confirmation`,
      priority: "medium",
      bookingId: b.booking_id,
    });
  });

  // 4. Completed bookings → review requests
  completedBookings.slice(0, 2).forEach((b) => {
    stack.push({
      type: "review_request",
      title: `Ask ${b.customer_name} for a review`,
      description: `Job done on ${b.booking_date} — reviews boost your ranking`,
      priority: "low",
      bookingId: b.booking_id,
    });
  });

  // 5. AI-generated suggestions (fill gaps)
  if (aiSuggestions?.length) {
    aiSuggestions.slice(0, 2).forEach((s) => {
      if (s.leadId && seenLeadIds.has(s.leadId)) return;
      stack.push(s);
    });
  }

  return stack.slice(0, 6);
}

export default function CopilotPriorityStack({ onAction }: Props) {
  const { data: business } = useProviderBusiness();
  const businessId = business?.id;

  const { data: aiSuggestions, isLoading: aiLoading, refetch, isFetching } = useProviderInsights();
  const { data: usage, isLoading: usageLoading } = useAIUsage();
  const { data: highIntentLeads = [], isLoading: hiLoading } = useHighIntentLeads();
  const { data: staleLeads = [], isLoading: staleLoading } = useStaleLeads(businessId);
  const { data: pendingBookings = [], isLoading: pendingLoading } = usePendingBookings(businessId);
  const { data: completedBookings = [], isLoading: completedLoading } = useCompletedBookings(businessId);

  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const isLoading = aiLoading || hiLoading || staleLoading || pendingLoading || completedLoading;

  const stack = buildPriorityStack(
    highIntentLeads, staleLeads, pendingBookings, completedBookings, aiSuggestions || [],
  );
  const visible = stack.filter((_, i) => !completed.has(`${i}`));

  const handleAction = (s: AISuggestion, idx: number) => {
    onAction?.(s);
    // Animate completion
    setCompleted((prev) => new Set([...prev, `${idx}`]));
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <Skeleton className="h-6 w-64" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Hero header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {visible.length > 0
                  ? "Here's what needs your attention"
                  : "You're all caught up 🎉"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {visible.length > 0
                  ? `${visible.length} action${visible.length !== 1 ? "s" : ""} to help you win more jobs`
                  : "Share your card to get more leads"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setCompleted(new Set()); refetch(); }}
            disabled={isFetching}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Value-first usage meter */}
      <AIUsageMeter usage={usage} isLoading={usageLoading} />

      {/* Priority stack */}
      <div className="p-4 pt-3">
        <AnimatePresence mode="popLayout">
          {visible.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-3"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-foreground">Nice work — nothing urgent right now</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Keep sharing your card to attract more leads.
                </p>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 mt-2">
                <Share2 className="h-3.5 w-3.5" /> Share Your Card
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {visible.map((s, idx) => {
                const realIdx = stack.indexOf(s);
                const cfg = typeConfig[s.type] || typeConfig.new_lead;
                const Icon = cfg.icon;
                const urgency = urgencyStyles[s.priority] || urgencyStyles.medium;

                return (
                  <motion.div
                    key={`${s.type}-${realIdx}-${s.leadId || s.bookingId || idx}`}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                    className="group relative flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-primary/20 bg-card hover:bg-muted/30 transition-all active:scale-[0.99]"
                  >
                    {/* Urgency dot */}
                    <div className="absolute top-3.5 left-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${urgency.dot}`} />
                    </div>

                    {/* Icon */}
                    <div className={`h-10 w-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 ml-1`}>
                      <Icon className={`h-4.5 w-4.5 ${cfg.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight truncate">
                        {s.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {s.description}
                      </p>
                    </div>

                    {/* Action button — big, thumb-friendly */}
                    <Button
                      size="sm"
                      className="h-9 px-4 text-xs font-semibold gap-1.5 shrink-0 min-w-[90px]"
                      onClick={() => handleAction(s, realIdx)}
                    >
                      {cfg.actionLabel}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
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
