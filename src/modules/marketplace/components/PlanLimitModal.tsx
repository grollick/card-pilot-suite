import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, CheckCircle2, Zap, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LimitKind } from "../hooks/useBusinessPlanStatus";

const LIMIT_CONTENT: Record<LimitKind, {
  icon: React.ElementType;
  headline: string;
  message: string;
  bullets: string[];
}> = {
  services: {
    icon: Zap,
    headline: "Service limit reached",
    message: "You've hit your plan's service limit. Upgrade to list more services and capture more types of work.",
    bullets: [
      "List more services to match more customer searches",
      "Each new service can bring in $500+/month",
      "Stand out with a full service catalog",
    ],
  },
  bookings: {
    icon: Users,
    headline: "Booking limit reached",
    message: "Great news — you're getting booked! Upgrade to accept unlimited appointments this month.",
    bullets: [
      "Accept unlimited bookings every month",
      "Never turn away a paying customer",
      "Automated reminders reduce no-shows",
    ],
  },
  service_areas: {
    icon: MapPin,
    headline: "Service area limit reached",
    message: "Expand your reach by upgrading. Serve more cities and capture customers in nearby areas.",
    bullets: [
      "Add more service areas to grow your territory",
      "Appear in searches across multiple cities",
      "More coverage = more leads",
    ],
  },
};

interface PlanLimitModalProps {
  open: boolean;
  onClose: () => void;
  limitKind: LimitKind;
  currentPlan: string;
  currentCount: number;
  maxLimit: number | null;
}

export default function PlanLimitModal({
  open,
  onClose,
  limitKind,
  currentPlan,
  currentCount,
  maxLimit,
}: PlanLimitModalProps) {
  const navigate = useNavigate();
  const content = LIMIT_CONTENT[limitKind];
  const Icon = content.icon;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary to-accent" />

              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="p-6 pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {currentPlan} plan
                  </Badge>
                  {maxLimit !== null && (
                    <Badge variant="outline" className="text-xs">
                      {currentCount}/{maxLimit} used
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground leading-tight">
                    {content.headline}
                  </h2>
                </div>

                <p className="text-sm text-muted-foreground mb-5">
                  {content.message}
                </p>

                <div className="space-y-2.5 mb-6">
                  {content.bullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{bullet}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="lg"
                    className="w-full font-semibold"
                    onClick={() => { onClose(); navigate("/pricing"); }}
                  >
                    Upgrade Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onClose}>
                    Cancel
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
