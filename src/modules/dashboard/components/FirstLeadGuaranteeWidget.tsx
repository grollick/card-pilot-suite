import { motion, AnimatePresence } from "framer-motion";
import { differenceInHours, differenceInMinutes } from "date-fns";
import {
  Zap, Clock, CheckCircle2, MessageSquare, ArrowRight,
  Sparkles, Target, Loader2, Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFirstLeadGuarantee } from "@/hooks/useFirstLeadGuarantee";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const STATUS_CONFIG = {
  monitoring: {
    icon: Target,
    color: "text-primary",
    bg: "bg-primary/10",
    borderColor: "border-primary/20",
    gradient: "from-primary/5 via-card to-accent/5",
  },
  matched: {
    icon: Zap,
    color: "text-[hsl(var(--success))]",
    bg: "bg-[hsl(var(--success))]/10",
    borderColor: "border-[hsl(var(--success))]/20",
    gradient: "from-[hsl(var(--success))]/5 via-card to-primary/5",
  },
  test_delivered: {
    icon: Gift,
    color: "text-[hsl(var(--warning))]",
    bg: "bg-[hsl(var(--warning))]/10",
    borderColor: "border-[hsl(var(--warning))]/20",
    gradient: "from-[hsl(var(--warning))]/5 via-card to-primary/5",
  },
  responded: {
    icon: CheckCircle2,
    color: "text-[hsl(var(--success))]",
    bg: "bg-[hsl(var(--success))]/10",
    borderColor: "border-[hsl(var(--success))]/20",
    gradient: "from-[hsl(var(--success))]/5 via-card to-[hsl(var(--success))]/5",
  },
  expired: {
    icon: Clock,
    color: "text-muted-foreground",
    bg: "bg-muted",
    borderColor: "border-border",
    gradient: "from-muted/30 via-card to-muted/30",
  },
};

function TimeRemaining({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const deadlineDate = new Date(deadline);
  const hoursLeft = differenceInHours(deadlineDate, now);
  const minutesLeft = differenceInMinutes(deadlineDate, now) % 60;
  const totalMinutes = differenceInMinutes(deadlineDate, now);
  const progressPct = Math.max(0, Math.min(100, ((24 * 60 - totalMinutes) / (24 * 60)) * 100));

  if (totalMinutes <= 0) {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Time elapsed</span>
          <span className="font-medium text-muted-foreground">Completed</span>
        </div>
        <Progress value={100} className="h-1.5" />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Time remaining</span>
        <span className="font-medium tabular-nums">
          {hoursLeft}h {minutesLeft}m left
        </span>
      </div>
      <Progress value={progressPct} className="h-1.5" />
    </div>
  );
}

const MILESTONES = [
  { key: "activated", label: "Guarantee activated", icon: Sparkles },
  { key: "lead", label: "First lead delivered", icon: Zap },
  { key: "responded", label: "First response sent", icon: MessageSquare },
];

export default function FirstLeadGuaranteeWidget() {
  const { data: guarantee, isLoading } = useFirstLeadGuarantee();
  const navigate = useNavigate();

  if (isLoading) return null;
  if (!guarantee) return null;

  // Don't show if responded or expired > 48 hours ago
  if (guarantee.status === "responded") {
    const respondedAge = Date.now() - new Date(guarantee.first_response_at!).getTime();
    if (respondedAge > 48 * 60 * 60 * 1000) return null;
  }
  if (guarantee.status === "expired") {
    const expiredAge = Date.now() - new Date(guarantee.deadline_at).getTime();
    if (expiredAge > 24 * 60 * 60 * 1000) return null;
  }

  const config = STATUS_CONFIG[guarantee.status];
  const StatusIcon = config.icon;

  const completedMilestones = new Set<string>();
  completedMilestones.add("activated");
  if (guarantee.first_lead_at) completedMilestones.add("lead");
  if (guarantee.first_response_at) completedMilestones.add("responded");

  const statusMessages: Record<string, { title: string; subtitle: string }> = {
    monitoring: {
      title: "We're helping you get your first opportunity",
      subtitle: "Our system is actively looking for leads and requests in your area. Make sure your card is published!",
    },
    matched: {
      title: "You've been matched with a real opportunity!",
      subtitle: "Check your contacts to see the new lead and respond quickly to make a great first impression.",
    },
    test_delivered: {
      title: "Your first practice lead is ready!",
      subtitle: "We've delivered a demo lead so you can try out the response workflow. Give it a try!",
    },
    responded: {
      title: "Amazing! You responded to your first lead 🎉",
      subtitle: "You've completed the First Lead Guarantee. Keep up the momentum!",
    },
    expired: {
      title: "Your 24-hour window has ended",
      subtitle: "Don't worry — leads will keep coming. Make sure your card is published and shared.",
    },
  };

  const msg = statusMessages[guarantee.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`rounded-2xl border ${config.borderColor} bg-gradient-to-br ${config.gradient} p-5 sm:p-6 relative overflow-hidden`}
    >
      {/* Subtle background animation */}
      {guarantee.status === "monitoring" && (
        <motion.div
          className="absolute -top-12 -right-12 h-40 w-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: "hsl(var(--primary) / 0.08)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
            <StatusIcon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold">{msg.title}</h3>
              {guarantee.status === "monitoring" && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-1 text-[10px] text-primary font-medium"
                >
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  Active
                </motion.div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{msg.subtitle}</p>
          </div>
        </div>

        {/* Time Remaining (only for monitoring) */}
        {guarantee.status === "monitoring" && (
          <TimeRemaining deadline={guarantee.deadline_at} />
        )}

        {/* Milestones */}
        <div className="flex items-center gap-0">
          {MILESTONES.map((m, i) => {
            const done = completedMilestones.has(m.key);
            const MIcon = m.icon;
            return (
              <div key={m.key} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
                    done
                      ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <MIcon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>
                    {m.label}
                  </span>
                </div>
                {i < MILESTONES.length - 1 && (
                  <div className={`h-px w-8 mx-1 mt-[-14px] ${
                    done ? "bg-[hsl(var(--success))]/30" : "bg-border"
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <AnimatePresence>
          {(guarantee.status === "matched" || guarantee.status === "test_delivered") && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Button
                size="sm"
                className="gap-1.5 rounded-xl text-xs"
                onClick={() => navigate("/app/contacts")}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                View & Respond
                <ArrowRight className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
          {guarantee.status === "monitoring" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl text-xs"
                onClick={() => navigate("/app/card")}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Make sure your card is ready
                <ArrowRight className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
