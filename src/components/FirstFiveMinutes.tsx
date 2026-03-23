import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileCache } from "@/hooks/useProfileCache";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Radio, ArrowRight, Eye, Zap,
  MessageSquare, TrendingUp, X, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type FlowStep = "card-live" | "turn-on-duty" | "opportunities" | "first-action" | "next-steps";

const STEPS: FlowStep[] = ["card-live", "turn-on-duty", "opportunities", "first-action", "next-steps"];

export default function FirstFiveMinutes() {
  const { user } = useAuth();
  const { data: profile } = useProfileCache();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<FlowStep>("card-live");
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [dutyToggled, setDutyToggled] = useState(false);

  const tourCompleted = profile?.tour_completed ?? false;
  const onboardingCompleted = (profile as any)?.onboarding_completed ?? false;
  const handle = (profile as any)?.handle || "";
  const company = (profile as any)?.company || profile?.name || "";

  // Show only for freshly onboarded users who haven't done the tour
  useEffect(() => {
    if (onboardingCompleted && !tourCompleted && !dismissed) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [onboardingCompleted, tourCompleted, dismissed]);

  const completeFlow = useCallback(async () => {
    setVisible(false);
    setDismissed(true);
    if (user) {
      await supabase
        .from("profiles")
        .update({ tour_completed: true } as any)
        .eq("id", user.id);
      queryClient.invalidateQueries({ queryKey: ["profile-cache"] });
    }
  }, [user, queryClient]);

  const handleDuty = useCallback(async () => {
    if (!user) return;
    try {
      await supabase.from("estimate_duty_status").upsert({
        user_id: user.id,
        is_on_duty: true,
        went_on_duty_at: new Date().toISOString(),
      } as any, { onConflict: "user_id" });
      setDutyToggled(true);
      setTimeout(() => setCurrentStep("opportunities"), 1200);
    } catch {
      setCurrentStep("opportunities");
    }
  }, [user]);

  const stepIndex = STEPS.indexOf(currentStep);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        >
          {/* Progress */}
          <div className="h-1.5 bg-muted">
            <motion.div
              className="h-full bg-primary rounded-r-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-0">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                First 5 Minutes
              </span>
            </div>
            <button
              onClick={completeFlow}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 pt-3">
            <AnimatePresence mode="wait">
              {/* STEP 1: Card is Live */}
              {currentStep === "card-live" && (
                <StepContainer key="card-live">
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
                    >
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Your card is live! 🎉</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {company} is now discoverable by customers nearby.
                      </p>
                    </div>
                    {handle && (
                      <button
                        onClick={() => window.open(`/${handle}`, "_blank")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium text-foreground cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" /> View your card
                      </button>
                    )}
                    <Button
                      onClick={() => setCurrentStep("turn-on-duty")}
                      className="w-full h-11 gap-2"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </StepContainer>
              )}

              {/* STEP 2: Turn On Duty */}
              {currentStep === "turn-on-duty" && (
                <StepContainer key="turn-on-duty">
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.15 }}
                      className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
                    >
                      <Radio className="h-8 w-8 text-primary" />
                    </motion.div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Go On Duty</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        You'll appear on the map and receive estimate requests from customers in your area.
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/50 border border-border p-3 text-left space-y-2">
                      <div className="flex items-start gap-2">
                        <Eye className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">Customers will see you're available now</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">You'll get notified for new job requests</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">Turn off anytime — you're in control</p>
                      </div>
                    </div>
                    {dutyToggled ? (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center justify-center gap-2 py-3 text-primary font-semibold"
                      >
                        <CheckCircle2 className="h-5 w-5" /> You're on duty!
                      </motion.div>
                    ) : (
                      <Button onClick={handleDuty} className="w-full h-11 gap-2">
                        <Radio className="h-4 w-4" /> Turn On Duty
                      </Button>
                    )}
                    <button
                      onClick={() => setCurrentStep("opportunities")}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      Skip for now
                    </button>
                  </div>
                </StepContainer>
              )}

              {/* STEP 3: Opportunities */}
              {currentStep === "opportunities" && (
                <StepContainer key="opportunities">
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.15 }}
                      className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
                    >
                      <Zap className="h-8 w-8 text-primary" />
                    </motion.div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Find Opportunities</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Respond to job requests to win new customers. Speed matters — fast responders win more jobs.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <SampleOpportunity
                        title="Looking for a quick estimate"
                        subtitle="Customer nearby • Posted just now"
                        onClick={() => setCurrentStep("first-action")}
                      />
                      <SampleOpportunity
                        title="Availability check"
                        subtitle="2 miles away • 5 min ago"
                        onClick={() => setCurrentStep("first-action")}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Tap an opportunity to see how responding works
                    </p>
                  </div>
                </StepContainer>
              )}

              {/* STEP 4: First Action Feedback */}
              {currentStep === "first-action" && (
                <StepContainer key="first-action">
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.15 }}
                      className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
                    >
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </motion.div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        Nice — you just responded! 🚀
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        That's how you win more jobs on the platform. Fast, professional responses convert the best.
                      </p>
                    </div>
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
                      <div className="flex items-center gap-2 justify-center">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-foreground">
                          Pros who respond in &lt;5 min win 3x more jobs
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setCurrentStep("next-steps")}
                      className="w-full h-11 gap-2"
                    >
                      See what's next <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </StepContainer>
              )}

              {/* STEP 5: Next Steps */}
              {currentStep === "next-steps" && (
                <StepContainer key="next-steps">
                  <div className="text-center space-y-4">
                    <h2 className="text-lg font-bold text-foreground">You're all set! 💪</h2>
                    <p className="text-sm text-muted-foreground">
                      Keep these tips in mind to grow faster:
                    </p>
                    <div className="space-y-2 text-left">
                      <TipRow icon={<Radio className="h-4 w-4 text-primary" />} text="Stay on duty to get more leads" />
                      <TipRow icon={<Clock className="h-4 w-4 text-primary" />} text="Respond quickly — speed wins" />
                      <TipRow icon={<TrendingUp className="h-4 w-4 text-primary" />} text="Check your dashboard for performance" />
                    </div>
                    <div className="space-y-2 pt-2">
                      <Button
                        onClick={() => {
                          completeFlow();
                          navigate("/app/duty");
                        }}
                        className="w-full h-11 gap-2"
                      >
                        <Radio className="h-4 w-4" /> Go to Duty Dashboard
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          completeFlow();
                          navigate("/app");
                        }}
                        className="w-full h-11"
                      >
                        Explore Dashboard
                      </Button>
                    </div>
                  </div>
                </StepContainer>
              )}
            </AnimatePresence>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-1.5 pb-5">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === stepIndex ? "w-5 bg-primary" : i < stepIndex ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StepContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function SampleOpportunity({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-all text-left cursor-pointer group"
    >
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <MessageSquare className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
    </button>
  );
}

function TipRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
      {icon}
      <p className="text-sm text-foreground">{text}</p>
    </div>
  );
}
