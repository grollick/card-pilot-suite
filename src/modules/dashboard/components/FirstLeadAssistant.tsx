import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Rocket, ArrowRight, Lightbulb,
  Globe, Wrench, Share2, UserPlus, CalendarCheck, PartyPopper, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ChecklistItem {
  key: string;
  label: string;
  tip: string;
  route: string;
  done: boolean;
  icon: typeof Rocket;
}

export default function FirstLeadAssistant() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const prevCompletedRef = useRef<Set<string>>(new Set());
  const [celebratingKey, setCelebratingKey] = useState<string | null>(null);
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  const { data: checklist = [] } = useQuery({
    queryKey: ["first-lead-checklist", user?.id],
    enabled: !!user && !!profile,
    staleTime: 30_000,
    queryFn: async (): Promise<ChecklistItem[]> => {
      const uid = user!.id;

      const [cardRes, serviceRes, leadRes, bookingRes] = await Promise.all([
        supabase.from("cards").select("id, status").eq("user_id", uid).limit(1).maybeSingle(),
        supabase.from("booking_services").select("id").eq("user_id", uid).eq("active", true).limit(1),
        supabase.from("leads").select("id").eq("user_id", uid).limit(1),
        supabase.from("bookings").select("id").eq("user_id", uid).limit(1),
      ]);

      const hasPublishedCard = cardRes.data?.status === "published";
      const hasServices = (serviceRes.data?.length ?? 0) > 0;
      const hasHandle = !!profile?.handle;
      const hasLead = (leadRes.data?.length ?? 0) > 0;
      const hasBooking = (bookingRes.data?.length ?? 0) > 0;

      return [
        {
          key: "card",
          label: "Publish your card",
          tip: "Your card must be live before customers can find you.",
          route: "/app/card",
          done: hasPublishedCard,
          icon: Globe,
        },
        {
          key: "services",
          label: "Add services",
          tip: "Add at least three services so customers know what you offer.",
          route: "/app/bookings",
          done: hasServices,
          icon: Wrench,
        },
        {
          key: "share",
          label: "Share your card",
          tip: "Send your card link to friends or post it on social media.",
          route: hasHandle ? `/app/card/qr` : "/app/settings",
          done: hasLead, // proxy: if they have a lead they likely shared
          icon: Share2,
        },
        {
          key: "lead",
          label: "Capture your first lead",
          tip: "Once your card is shared, leads will appear in your Contacts.",
          route: "/app/contacts",
          done: hasLead,
          icon: UserPlus,
        },
        {
          key: "booking",
          label: "Get your first booking",
          tip: "Customers can book directly from your card once services are set up.",
          route: "/app/bookings",
          done: hasBooking,
          icon: CalendarCheck,
        },
      ];
    },
  });

  // ── Milestone notifications ──
  const milestoneMessages: Record<string, { title: string; description: string }> = {
    card: { title: "🎉 Your card is live!", description: "Customers can now find and contact you." },
    services: { title: "✅ Services added!", description: "Customers can see what you offer." },
    lead: { title: "🎉 Congratulations!", description: "Your first lead has arrived." },
    booking: { title: "🎊 First booking!", description: "Your first customer booked through CardPilot." },
  };

  useEffect(() => {
    if (checklist.length === 0) return;

    const currentDone = new Set(checklist.filter((c) => c.done).map((c) => c.key));
    const prev = prevCompletedRef.current;

    // Find newly completed items (skip on first load)
    if (prev.size > 0) {
      for (const key of currentDone) {
        if (!prev.has(key) && milestoneMessages[key]) {
          const msg = milestoneMessages[key];
          setCelebratingKey(key);
          toast.success(msg.title, { description: msg.description, duration: 5000 });
          setTimeout(() => setCelebratingKey(null), 3000);
        }
      }
    }

    prevCompletedRef.current = currentDone;
  }, [checklist]);

  const completedCount = checklist.filter((c) => c.done).length;
  const allDone = completedCount === checklist.length && checklist.length > 0;
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  // Fully completed — show celebration then hide
  if (allDone) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="rounded-xl border border-success/30 bg-success/5 p-5 text-center"
      >
        <PartyPopper className="h-8 w-8 text-success mx-auto mb-2" />
        <h3 className="font-semibold text-sm text-foreground">You're all set! 🎉</h3>
        <p className="text-xs text-muted-foreground mt-1">
          You've completed all activation steps. Keep sharing your card to grow your business!
        </p>
      </motion.div>
    );
  }

  const nextItem = checklist.find((c) => !c.done);

  // Progress ring dimensions
  const ringSize = 52;
  const strokeWidth = 4;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-5"
    >
      {/* Header with progress ring */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative shrink-0">
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
            />
            <motion.circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-primary tabular-nums">{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-sm">Get Your First Lead</h2>
          <p className="text-2xs text-muted-foreground">
            Complete these steps to start capturing leads and bookings.
          </p>
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-1">
        {checklist.map((item) => {
          const Icon = item.icon;
          const isCelebrating = celebratingKey === item.key;
          const isExpanded = expandedTip === item.key;

          return (
            <div key={item.key}>
              <button
                onClick={() => {
                  if (item.done) return;
                  setExpandedTip(isExpanded ? null : item.key);
                }}
                className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm ${
                  item.done
                    ? "text-muted-foreground opacity-50"
                    : "hover:bg-primary/5 cursor-pointer"
                } ${isCelebrating ? "bg-success/10 animate-pulse" : ""}`}
                disabled={item.done}
              >
                {item.done ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, stiffness: 200 }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  </motion.div>
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/20 flex items-center justify-center shrink-0">
                    <Icon className="h-3 w-3 text-muted-foreground/40" />
                  </div>
                )}
                <span className={`flex-1 ${item.done ? "line-through" : "font-medium"}`}>
                  {item.label}
                </span>
                {!item.done && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                )}
              </button>

              {/* Expandable tip */}
              <AnimatePresence>
                {isExpanded && !item.done && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-11 mr-3 mb-2 p-3 rounded-lg bg-muted/40 border border-border">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.tip}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 text-xs h-7 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(item.route);
                        }}
                      >
                        {item.label} <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Primary CTA */}
      {nextItem && (
        <Button
          size="sm"
          className="mt-4 shadow-glow gap-1.5 w-full"
          onClick={() => navigate(nextItem.route)}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {nextItem.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </motion.div>
  );
}
