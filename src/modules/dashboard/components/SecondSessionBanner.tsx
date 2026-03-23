import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileCache } from "@/hooks/useProfileCache";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Radio, ArrowRight, TrendingUp, AlertTriangle,
  CheckCircle2, Zap, X, Eye, Clock, Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * SecondSessionBanner – shows on the dashboard for returning users
 * (onboarding + tour completed, visited at least once before).
 * Dismissed per-session via sessionStorage.
 */
export default function SecondSessionBanner() {
  const { user } = useAuth();
  const { data: profile } = useProfileCache();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const tourCompleted = profile?.tour_completed ?? false;
  const onboardingCompleted = (profile as any)?.onboarding_completed ?? false;
  const firstName = profile?.name?.split(" ")[0] || "there";

  // Only show for returning users (tour done = they've been here before)
  const shouldShow = onboardingCompleted && tourCompleted && !dismissed;

  // Check sessionStorage so it only shows once per session
  useEffect(() => {
    if (sessionStorage.getItem("second_session_dismissed") === "1") {
      setDismissed(true);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("second_session_dismissed", "1");
  };

  // Fetch activity summary
  const { data: stats } = useQuery({
    queryKey: ["second-session-stats", user?.id],
    enabled: !!user && shouldShow,
    staleTime: 60_000,
    queryFn: async () => {
      const userId = user!.id;
      const [leadsRes, bookingsRes, dutyRes, matchesRes] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("estimate_duty_status").select("is_on_duty").eq("user_id", userId).maybeSingle(),
        supabase.from("estimate_matches").select("id", { count: "exact", head: true })
          .eq("user_id", userId).eq("status", "pending"),
      ]);
      const missedRes = await supabase.from("estimate_matches")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId).eq("status", "expired");

      return {
        totalLeads: leadsRes.count ?? 0,
        totalBookings: bookingsRes.count ?? 0,
        isOnDuty: dutyRes.data?.is_on_duty ?? false,
        pendingOpportunities: matchesRes.count ?? 0,
        missedOpportunities: missedRes.count ?? 0,
      };
    },
  });

  // Daily tip (simple rotation)
  const dailyTip = useMemo(() => {
    const tips = [
      "Respond to leads within 5 minutes to win 3× more jobs.",
      "Share your card link on social media to attract new customers.",
      "Stay on duty during peak hours for the best opportunities.",
      "Complete your profile to rank higher in the marketplace.",
      "Add more services to capture a wider range of jobs.",
    ];
    const dayIndex = new Date().getDate() % tips.length;
    return tips[dayIndex];
  }, []);

  if (!shouldShow || !stats) return null;

  const hasProgress = stats.totalLeads > 0 || stats.totalBookings > 0;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-primary/15 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--card)), hsl(var(--accent) / 0.04))",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Welcome back, {firstName} 👋
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Here's what's happening since your last visit
              </p>
            </div>
            <button
              onClick={dismiss}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5 space-y-3">
            {/* Activity Summary Row */}
            <div className="flex gap-2">
              <StatChip
                icon={<Eye className="h-3.5 w-3.5" />}
                label="Leads"
                value={stats.totalLeads}
                onClick={() => { dismiss(); navigate("/app/contacts"); }}
              />
              <StatChip
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                label="Bookings"
                value={stats.totalBookings}
                onClick={() => { dismiss(); navigate("/app/bookings"); }}
              />
              <StatChip
                icon={<Radio className="h-3.5 w-3.5" />}
                label="Status"
                value={stats.isOnDuty ? "On Duty" : "Off Duty"}
                highlight={stats.isOnDuty}
                onClick={() => { dismiss(); navigate("/app/duty"); }}
              />
            </div>

            {/* Duty CTA if off */}
            {!stats.isOnDuty && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                onClick={() => { dismiss(); navigate("/app/duty"); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all text-left cursor-pointer group"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Radio className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Turn On Duty</p>
                  <p className="text-xs text-muted-foreground">Be visible to customers and receive job requests</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
              </motion.button>
            )}

            {/* Pending Opportunities */}
            {stats.pendingOpportunities > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => { dismiss(); navigate("/app/job-requests"); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-all text-left cursor-pointer group"
              >
                <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                  <Flame className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {stats.pendingOpportunities} Pending {stats.pendingOpportunities === 1 ? "Opportunity" : "Opportunities"}
                  </p>
                  <p className="text-xs text-muted-foreground">Respond now before they expire</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-destructive transition-colors shrink-0" />
              </motion.button>
            )}

            {/* Missed Opportunities (FOMO) */}
            {stats.missedOpportunities > 0 && stats.pendingOpportunities === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive/70 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  You missed {stats.missedOpportunities} {stats.missedOpportunities === 1 ? "opportunity" : "opportunities"} — stay on duty to catch the next one.
                </p>
              </div>
            )}

            {/* Progress reinforcement */}
            {hasProgress && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
                <p className="text-xs text-foreground">
                  {stats.totalBookings > 0
                    ? `Great progress! You've booked ${stats.totalBookings} ${stats.totalBookings === 1 ? "job" : "jobs"} so far.`
                    : `You've captured ${stats.totalLeads} ${stats.totalLeads === 1 ? "lead" : "leads"} — keep going!`}
                </p>
              </div>
            )}

            {/* AI Coach Tip */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-accent/30 border border-accent/20">
              <Zap className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Daily Tip</p>
                <p className="text-xs text-foreground">{dailyTip}</p>
              </div>
            </div>

            {/* Primary CTA */}
            <Button
              onClick={() => {
                dismiss();
                if (stats.pendingOpportunities > 0) {
                  navigate("/app/job-requests");
                } else if (!stats.isOnDuty) {
                  navigate("/app/duty");
                } else {
                  navigate("/app/contacts");
                }
              }}
              className="w-full h-10 gap-2"
            >
              {stats.pendingOpportunities > 0
                ? "Review Opportunities"
                : !stats.isOnDuty
                  ? "Go On Duty"
                  : "View Your Leads"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatChip({
  icon, label, value, highlight, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl border border-border hover:bg-muted/50 transition-all cursor-pointer"
    >
      <div className={`${highlight ? "text-primary" : "text-muted-foreground"}`}>{icon}</div>
      <span className={`text-sm font-bold ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </button>
  );
}
