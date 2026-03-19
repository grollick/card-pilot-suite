import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProfileCache } from "@/hooks/useProfileCache";

interface TourStep {
  title: string;
  description: string;
  selector?: string;
  icon: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to guzzl.pro! 🚀",
    description: "Let's take a quick tour of your business growth platform. We'll show you how to generate leads and book more customers in just a few minutes.",
    icon: "👋",
  },
  {
    title: "Business Performance",
    description: "Your dashboard shows real-time metrics — leads captured, bookings made, and revenue trends. Check here daily to stay on top of your business.",
    selector: "[data-tour='dashboard']",
    icon: "📊",
  },
  {
    title: "Your Digital Card",
    description: "Your card is your lead-capturing machine. Customize it, share the link or QR code, and watch leads flow in automatically.",
    selector: "[data-tour='card']",
    icon: "💳",
  },
  {
    title: "Contacts & CRM",
    description: "Every lead form submission and booking request lands here. Track conversations, set follow-up tasks, and never lose a potential customer.",
    selector: "[data-tour='contacts']",
    icon: "👥",
  },
  {
    title: "Booking System",
    description: "Customers can book appointments directly from your card. Manage your availability, services, and upcoming appointments all in one place.",
    selector: "[data-tour='bookings']",
    icon: "📅",
  },
  {
    title: "Analytics & Growth",
    description: "Track who views your card, where leads come from, and which marketing efforts drive the most bookings. Data-driven growth starts here.",
    selector: "[data-tour='analytics']",
    icon: "📈",
  },
];

export default function ProductTour() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const { data: profileCache } = useProfileCache();
  const tourCompleted = profileCache?.tour_completed ?? false;

  const completeTour = useMutation({
    mutationFn: async () => {
      await supabase
        .from("profiles")
        .update({ tour_completed: true } as any)
        .eq("id", user!.id);
    },
    onSuccess: () => {
      queryClient.setQueryData(["tour-completed", user?.id], true);
    },
  });

  useEffect(() => {
    if (tourCompleted === false) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [tourCompleted]);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setIsVisible(false);
      completeTour.mutate();
    }
  }, [currentStep, completeTour]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    setIsVisible(false);
    completeTour.mutate();
  }, [completeTour]);

  const step = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={handleSkip}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md"
          >
            <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              {/* Progress bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{step.icon}</span>
                    <div>
                      <h3 className="font-semibold text-base text-foreground">{step.title}</h3>
                      <p className="text-2xs text-muted-foreground">
                        Step {currentStep + 1} of {TOUR_STEPS.length}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentStep}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-muted-foreground leading-relaxed mb-6"
                  >
                    {step.description}
                  </motion.p>
                </AnimatePresence>

                {/* Step indicators */}
                <div className="flex items-center justify-center gap-1.5 mb-5">
                  {TOUR_STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === currentStep
                          ? "w-6 bg-primary"
                          : i < currentStep
                          ? "w-1.5 bg-primary/40"
                          : "w-1.5 bg-muted-foreground/20"
                      }`}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={currentStep === 0 ? handleSkip : handlePrev}
                    className="text-xs text-muted-foreground"
                  >
                    {currentStep === 0 ? (
                      "Skip tour"
                    ) : (
                      <>
                        <ChevronLeft className="h-3 w-3 mr-1" /> Back
                      </>
                    )}
                  </Button>
                  <Button size="sm" onClick={handleNext} className="gap-1.5 shadow-glow">
                    {currentStep === TOUR_STEPS.length - 1 ? (
                      <>
                        Get Started <Rocket className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
