import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileCache } from "@/hooks/useProfileCache";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import {
  Radio, ArrowRight, TrendingUp, Eye, Star,
  CheckCircle2, Zap, X, Share2, Pencil,
  Trophy, Calendar, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface DayConfig {
  day: number;
  theme: string;
  title: string;
  subtitle: string;
  tip: string;
  actionLabel: string;
  actionRoute: string;
  icon: React.ReactNode;
}

const DAY_CONFIGS: DayConfig[] = [
  {
    day: 1,
    theme: "activation",
    title: "Let's get your first lead",
    subtitle: "Go on duty so customers can find you.",
    tip: "Pros who go on duty in their first hour get leads 4× faster.",
    actionLabel: "Turn On Duty",
    actionRoute: "/app/duty",
    icon: <Radio className="h-5 w-5" />,
  },
  {
    day: 2,
    theme: "re-engagement",
    title: "You're building momentum",
    subtitle: "Check for new opportunities and respond fast.",
    tip: "Responding within 5 minutes triples your win rate.",
    actionLabel: "Check Opportunities",
    actionRoute: "/app/job-requests",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    day: 3,
    theme: "confidence",
    title: "Make your card stand out",
    subtitle: "Add a photo and tweak your tagline for more clicks.",
    tip: "Cards with a profile photo get 2× more views.",
    actionLabel: "Edit Your Card",
    actionRoute: "/app/card",
    icon: <Pencil className="h-5 w-5" />,
  },
  {
    day: 4,
    theme: "profile-improvement",
    title: "Complete your profile",
    subtitle: "Add services and your service area to rank higher.",
    tip: "Complete profiles appear 60% higher in search results.",
    actionLabel: "Update Services",
    actionRoute: "/app/services",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  {
    day: 5,
    theme: "social-proof",
    title: "Share your card",
    subtitle: "Post your card link on social media or send it to past clients.",
    tip: "Shared cards generate 5× more leads than passive profiles.",
    actionLabel: "Share Your Card",
    actionRoute: "/app/card/qr",
    icon: <Share2 className="h-5 w-5" />,
  },
  {
    day: 6,
    theme: "urgency",
    title: "Don't miss out",
    subtitle: "Stay on duty during peak hours to catch every lead.",
    tip: "Most job requests come between 8 AM and 6 PM.",
    actionLabel: "Go On Duty",
    actionRoute: "/app/duty",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    day: 7,
    theme: "summary",
    title: "Your first week in review",
    subtitle: "See how far you've come — great start!",
    tip: "Users who stay active past week 1 are 10× more likely to book jobs.",
    actionLabel: "View Dashboard",
    actionRoute: "/app",
    icon: <Trophy className="h-5 w-5" />,
  },
];

export default function Week1RetentionWidget() {
  const { user } = useAuth();
  const { data: profile } = useProfileCache();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const onboardingCompleted = (profile as any)?.onboarding_completed ?? false;

  // Calculate which day the user is on (1-7)
  const userDay = useMemo(() => {
    if (!profile) return 0;
    const createdAt = (profile as any)?.created_at;
    if (!createdAt) return 1;
    const days = differenceInDays(new Date(), new Date(createdAt));
    return Math.min(Math.max(days + 1, 1), 8); // day 1-8 (8 = past week 1)
  }, [profile]);

  // Don't show if not onboarded, past week 1, or dismissed
  const shouldShow = onboardingCompleted && userDay >= 1 && userDay <= 7 && !dismissed;

  // Fetch activity stats
  const { data: stats } = useQuery({
    queryKey: ["week1-retention-stats", user?.id],
    enabled: !!user && shouldShow,
    staleTime: 60_000,
    queryFn: async () => {
      const userId = user!.id;
      const [leadsRes, viewsRes, bookingsRes, dutyRes] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("analytics_events").select("id", { count: "exact", head: true })
          .eq("user_id", userId).eq("event_type", "card_view"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("estimate_duty_status").select("is_on_duty, leads_received").eq("user_id", userId).maybeSingle(),
      ]);
      return {
        leads: leadsRes.count ?? 0,
        cardViews: viewsRes.count ?? 0,
        bookings: bookingsRes.count ?? 0,
        isOnDuty: dutyRes.data?.is_on_duty ?? false,
        opportunitiesReceived: (dutyRes.data as any)?.leads_received ?? 0,
      };
    },
  });

  if (!shouldShow) return null;

  const dayConfig = DAY_CONFIGS[userDay - 1];
  const progressPercent = (userDay / 7) * 100;
  const isSummaryDay = userDay === 7;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-primary/15 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--card)), hsl(var(--accent) / 0.03))",
          }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Day {userDay} of 7
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {dayConfig.theme.replace("-", " ")}
              </span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-2">
            <Progress value={progressPercent} className="h-1.5" />
          </div>

          <div className="px-4 pb-4 space-y-3">
            {/* Day title + action */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                {dayConfig.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground">{dayConfig.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{dayConfig.subtitle}</p>
              </div>
            </div>

            {/* Activity stats (compact) */}
            {stats && (
              <div className="flex gap-1.5">
                <MiniStat label="Views" value={stats.cardViews} />
                <MiniStat label="Leads" value={stats.leads} />
                <MiniStat label="Bookings" value={stats.bookings} />
                <MiniStat label="Opps" value={stats.opportunitiesReceived} />
              </div>
            )}

            {/* Weekly summary on day 7 */}
            {isSummaryDay && stats && (
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold text-foreground">Week 1 Summary</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Card views: </span>
                    <span className="font-semibold text-foreground">{stats.cardViews}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Leads captured: </span>
                    <span className="font-semibold text-foreground">{stats.leads}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Jobs booked: </span>
                    <span className="font-semibold text-foreground">{stats.bookings}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Opportunities: </span>
                    <span className="font-semibold text-foreground">{stats.opportunitiesReceived}</span>
                  </div>
                </div>
                {stats.leads > 0 && (
                  <p className="text-xs text-primary font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    You're off to a great start — keep it going!
                  </p>
                )}
              </div>
            )}

            {/* Daily tip */}
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-accent/30 border border-accent/20">
              <Star className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-foreground leading-relaxed">{dayConfig.tip}</p>
            </div>

            {/* Day progress dots */}
            <div className="flex items-center justify-center gap-1">
              {DAY_CONFIGS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i + 1 === userDay
                      ? "w-4 bg-primary"
                      : i + 1 < userDay
                        ? "w-1.5 bg-primary/40"
                        : "w-1.5 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>

            {/* CTA */}
            <Button
              onClick={() => {
                setDismissed(true);
                navigate(dayConfig.actionRoute);
              }}
              className="w-full h-9 gap-2 text-sm"
            >
              {dayConfig.actionLabel}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 text-center py-1.5 rounded-lg bg-muted/50 border border-border">
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}
